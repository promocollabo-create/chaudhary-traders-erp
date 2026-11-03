-- ============================================================
-- Chaudhary Traders ERP — ONLINE LOGIN + DATA SECURITY
-- Supabase → SQL Editor → New query → poora paste karein → Run.
-- Dobara chalana safe hai (purana data nahi mitta).
--
-- Is ke baad:
--   • Database sirf login ke baad khulta hai (sirf key se kuch nahi milta).
--   • Staff (users list wale) = poora data.
--   • Customer (portal) = sirf apna data, server khud chhaant kar deta hai.
--   • QR scan (bina login) = sirf wohi aik document / customer.
-- Login wahi username/password hain jo app mein pehle se hain.
-- ============================================================

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.kv_store (
  key text primary key,
  value jsonb,
  updated_at timestamptz default now()
);

create table if not exists public.ct_members (
  uid uuid primary key,
  username text not null,
  role text not null check (role in ('staff', 'customer')),
  customer_id text,
  updated_at timestamptz default now()
);
alter table public.ct_members enable row level security;   -- no policies: only the functions below touch it

-- ---------- helpers ----------
create or replace function public.ct_arr(p jsonb) returns jsonb
language sql immutable as $$ select case when jsonb_typeof(p) = 'array' then p else '[]'::jsonb end $$;

create or replace function public.ct_kv(p_key text) returns jsonb
language sql stable security definer set search_path = public as $$ select value from public.kv_store where key = p_key $$;

-- Staff list (falls back to the app's two default logins on a brand-new database).
create or replace function public.ct_staff_list() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(public.ct_kv('ct-users'),
    '[{"username":"admin","password":"admin123"},{"username":"staff","password":"staff123"}]'::jsonb)
$$;

-- Is the signed-in user a staff member who is still in the users list?
create or replace function public.ct_is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.ct_members m
    where m.uid = auth.uid() and m.role = 'staff'
      and exists (select 1 from jsonb_array_elements(public.ct_arr(public.ct_staff_list())) e
                  where lower(e->>'username') = m.username)
  )
$$;

-- Customer id of the signed-in portal user (null when not a valid customer login).
create or replace function public.ct_my_customer() returns text
language sql stable security definer set search_path = public as $$
  select m.customer_id from public.ct_members m
  where m.uid = auth.uid() and m.role = 'customer'
    and exists (select 1 from jsonb_array_elements(public.ct_arr(public.ct_kv('ct-customers'))) e
                where e->>'id' = m.customer_id and lower(coalesce(e->>'portalUsername', '')) = m.username
                  and coalesce(e->>'status', 'Active') <> 'Inactive')
$$;

-- ---------- login ----------
-- Checks the username/password against the app's own users / customers list and
-- creates (or refreshes) the matching online login. Returns the login email.
create or replace function public.ct_login_prepare(p_username text, p_password text) returns jsonb
language plpgsql volatile security definer set search_path = public, extensions as $$
declare
  v_un text := lower(trim(coalesce(p_username, '')));
  v_staff jsonb; v_cust jsonb; v_role text; v_cid text; v_email text; v_uid uuid;
begin
  if v_un = '' or coalesce(p_password, '') = '' then return jsonb_build_object('ok', false); end if;
  select e into v_staff from jsonb_array_elements(public.ct_arr(public.ct_staff_list())) e
    where lower(e->>'username') = v_un and e->>'password' = p_password limit 1;
  if v_staff is not null then
    v_role := 'staff';
  else
    select e into v_cust from jsonb_array_elements(public.ct_arr(public.ct_kv('ct-customers'))) e
      where coalesce(e->>'portalUsername', '') <> '' and lower(e->>'portalUsername') = v_un
        and e->>'portalPassword' = p_password and coalesce(e->>'status', 'Active') <> 'Inactive' limit 1;
    if v_cust is null then
      perform pg_sleep(0.6);                       -- slows down password guessing
      return jsonb_build_object('ok', false);
    end if;
    v_role := 'customer'; v_cid := v_cust->>'id';
  end if;

  v_email := (case when v_role = 'staff' then 's.' else 'c.' end) || md5(v_un) || '@ct-erp.app';
  select id into v_uid from auth.users where email = v_email;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token)
    values ('00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', v_email,
      crypt(p_password, gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now(), '', '', '', '');
    insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid, v_uid::text,
      jsonb_build_object('sub', v_uid::text, 'email', v_email, 'email_verified', true), 'email', now(), now(), now());
  else
    update auth.users set encrypted_password = crypt(p_password, gen_salt('bf')), updated_at = now() where id = v_uid;
  end if;

  insert into public.ct_members (uid, username, role, customer_id, updated_at)
  values (v_uid, v_un, v_role, v_cid, now())
  on conflict (uid) do update set username = excluded.username, role = excluded.role,
    customer_id = excluded.customer_id, updated_at = now();

  return jsonb_build_object('ok', true, 'email', v_email, 'role', v_role, 'customerId', v_cid);
end $$;

-- Who am I (used when the app reopens with a saved login).
create or replace function public.ct_me() returns jsonb
language sql stable security definer set search_path = public as $$
  select case
    when public.ct_is_staff() then (select jsonb_build_object('role', 'staff', 'username', username) from public.ct_members where uid = auth.uid())
    when public.ct_my_customer() is not null then (select jsonb_build_object('role', 'customer', 'username', username, 'customerId', customer_id) from public.ct_members where uid = auth.uid())
    else null end
$$;

-- ---------- table rules ----------
alter table public.kv_store enable row level security;
drop policy if exists "ct app access" on public.kv_store;
drop policy if exists "ct staff only" on public.kv_store;
create policy "ct staff only" on public.kv_store for all to authenticated
  using ((select public.ct_is_staff())) with check ((select public.ct_is_staff()));
revoke all on public.kv_store from anon;

-- ---------- what a customer may see ----------
create or replace function public.ct_cust_view(p_key text, p_val jsonb, p_cid text, p_public boolean) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare r jsonb;
begin
  if p_val is null or p_cid is null then return null; end if;
  if p_key = 'ct-customers' then
    select coalesce(jsonb_agg(case when p_public then e - 'portalPassword' - 'portalUsername' else e end), '[]')
      into r from jsonb_array_elements(public.ct_arr(p_val)) e where e->>'id' = p_cid;
    return r;
  elsif p_key in ('ct-invoices', 'ct-payments', 'ct-returns', 'ct-exchanges', 'ct-creditnotes', 'ct-promises',
                  'ct-adjustments', 'ct-orders', 'ct-bookings', 'ct-portal-payments', 'ct-portal-msgs', 'ct-credit-log',
                  'ct-booking-requests') then
    select coalesce(jsonb_agg(e), '[]') into r from jsonb_array_elements(public.ct_arr(p_val)) e where e->>'customerId' = p_cid;
    return r;
  elsif p_key = 'ct-transfers' then
    select coalesce(jsonb_agg(e), '[]') into r from jsonb_array_elements(public.ct_arr(p_val)) e
      where e->>'fromCustomerId' = p_cid or e->>'toCustomerId' = p_cid;
    return r;
  elsif p_key in ('ct-portal-profiles', 'ct-credit-state') then
    if jsonb_typeof(p_val) <> 'object' or not (p_val ? p_cid) then return '{}'::jsonb; end if;
    return jsonb_build_object(p_cid, p_val->p_cid);
  elsif p_key = 'ct-delivery-plans' then
    if jsonb_typeof(p_val) <> 'object' then return '{}'::jsonb; end if;
    select coalesce(jsonb_object_agg(k, v), '{}') into r from jsonb_each(p_val) as x(k, v)
      where k in (select b->>'id' from jsonb_array_elements(public.ct_arr(public.ct_kv('ct-bookings'))) b where b->>'customerId' = p_cid);
    return r;
  elsif p_key in ('ct-settings', 'ct-branches', 'ct-fin-settings', 'ct-urdu-dict') then
    return p_val;
  elsif p_key in ('ct-products', 'ct-offers') and not p_public then
    return p_val;
  elsif p_key = 'ct-users' then
    return '[]'::jsonb;
  elsif p_key like 'ct-portalpay-file:%' and not p_public then
    if exists (select 1 from jsonb_array_elements(public.ct_arr(public.ct_kv('ct-portal-payments'))) e
               where e->>'id' = substr(p_key, 19) and e->>'customerId' = p_cid) then return p_val; end if;
    return null;
  end if;
  return null;
end $$;

-- Portal (signed-in customer): read
create or replace function public.portal_get(p_keys text[] default null, p_like text default null)
returns table (key text, value jsonb)
language plpgsql stable security definer set search_path = public as $$
declare v_cid text := public.ct_my_customer();
begin
  if v_cid is null then return; end if;
  return query
    select k.key, public.ct_cust_view(k.key, k.value, v_cid, false)
    from public.kv_store k
    where ((p_keys is not null and k.key = any (p_keys)) or (p_like is not null and k.key like p_like))
      and public.ct_cust_view(k.key, k.value, v_cid, false) is not null;
end $$;

-- Portal (signed-in customer): write — only what the portal really saves, merged safely.
create or replace function public.portal_put(p_key text, p_value jsonb) returns boolean
language plpgsql volatile security definer set search_path = public as $$
declare
  v_cid text := public.ct_my_customer();
  cur jsonb; nxt jsonb; inc jsonb; k text; v jsonb;
begin
  if v_cid is null or p_key is null then return false; end if;
  perform pg_advisory_xact_lock(hashtext(p_key));
  select value into cur from public.kv_store where key = p_key;

  if p_key in ('ct-orders', 'ct-promises', 'ct-portal-payments', 'ct-portal-msgs', 'ct-booking-requests', 'ct-auditlog') then
    -- add new records only (a customer cannot change or delete existing ones)
    select coalesce(jsonb_agg(e), '[]') into inc from jsonb_array_elements(public.ct_arr(p_value)) e
      where (p_key = 'ct-auditlog' or e->>'customerId' = v_cid)
        and coalesce(e->>'id', '') <> ''
        and not exists (select 1 from jsonb_array_elements(public.ct_arr(cur)) c where c->>'id' = e->>'id');
    if jsonb_array_length(inc) = 0 then return true; end if;
    if p_key = 'ct-auditlog' and jsonb_array_length(inc) > 20 then return false; end if;
    nxt := public.ct_arr(cur) || inc;
  elsif p_key = 'ct-settings' then
    -- only document counters, and only upwards
    nxt := coalesce(cur, '{}'::jsonb);
    if jsonb_typeof(p_value) <> 'object' then return false; end if;
    for k, v in select * from jsonb_each(p_value) loop
      if k like '%Counter' and jsonb_typeof(v) = 'number'
         and (v::numeric) > coalesce((nxt->>k)::numeric, 0) and (v::numeric) <= coalesce((nxt->>k)::numeric, 0) + 50 then
        nxt := jsonb_set(nxt, array[k], v);
      end if;
    end loop;
  elsif p_key = 'ct-customers' then
    -- own portal password only
    select e->'portalPassword' into v from jsonb_array_elements(public.ct_arr(p_value)) e where e->>'id' = v_cid limit 1;
    if v is null or jsonb_typeof(v) <> 'string' or length(v #>> '{}') < 4 then return false; end if;
    select jsonb_agg(case when e->>'id' = v_cid then jsonb_set(e, '{portalPassword}', v) else e end)
      into nxt from jsonb_array_elements(public.ct_arr(cur)) e;
  elsif p_key = 'ct-portal-profiles' then
    if jsonb_typeof(p_value) <> 'object' or not (p_value ? v_cid) then return false; end if;
    nxt := (case when jsonb_typeof(cur) = 'object' then cur else '{}'::jsonb end) || jsonb_build_object(v_cid, p_value->v_cid);
  elsif p_key like 'ct-portalpay-file:%' then
    if cur is not null or p_value is null or length(p_value::text) > 4000000 then return false; end if;
    nxt := p_value;
  else
    return false;
  end if;

  insert into public.kv_store (key, value, updated_at) values (p_key, nxt, now())
  on conflict (key) do update set value = excluded.value, updated_at = now();
  return true;
end $$;

-- QR scan without login: only the scanned document (and its customer / employee).
create or replace function public.public_get(p_kind text, p_id text, p_keys text[] default null, p_like text default null)
returns table (key text, value jsonb)
language plpgsql stable security definer set search_path = public as $$
declare v_cid text; v_emp text; r jsonb; kk text;
begin
  if p_kind is null or p_id is null or length(p_id) > 200 then return; end if;
  if p_kind = 'i' then
    select e->>'customerId' into v_cid from jsonb_array_elements(public.ct_arr(public.ct_kv('ct-invoices'))) e where e->>'id' = p_id limit 1;
  elsif p_kind = 'b' then
    select e->>'customerId' into v_cid from jsonb_array_elements(public.ct_arr(public.ct_kv('ct-bookings'))) e where e->>'id' = p_id limit 1;
  elsif p_kind = 'c' then v_cid := p_id;
  elsif p_kind = 'w' then v_cid := split_part(p_id, '~', 1);
  elsif p_kind = 'e' then v_emp := p_id;
  elsif p_kind = 'l' then
    select e->>'empId' into v_emp from jsonb_array_elements(public.ct_arr(public.ct_kv('ct-leaves'))) e where e->>'id' = p_id limit 1;
  elsif p_kind = 'a' then
    select e->>'empId' into v_emp from jsonb_array_elements(public.ct_arr(public.ct_kv('ct-advances'))) e where e->>'id' = p_id limit 1;
  elsif p_kind = 's' then v_emp := split_part(p_id, '~', 2);
  end if;

  for kk in select unnest(coalesce(p_keys, array[]::text[])) loop
    r := null;
    if kk in ('ct-settings', 'ct-branches', 'ct-fin-settings', 'ct-urdu-dict') then
      r := public.ct_kv(kk);
    elsif v_cid is not null then
      r := public.ct_cust_view(kk, public.ct_kv(kk), v_cid, true);
    elsif v_emp is not null then
      if kk = 'ct-employees' then
        select coalesce(jsonb_agg(jsonb_build_object('id', e->'id', 'name', e->'name', 'number', e->'number', 'post', e->'post',
                 'status', e->'status', 'joinDate', e->'joinDate', 'photo', e->'photo',
                 'cnic', to_jsonb(regexp_replace(coalesce(e->>'cnic', ''), '\d(?=.*\d)', '*', 'g')),
                 'branchId', e->'branchId')), '[]')
          into r from jsonb_array_elements(public.ct_arr(public.ct_kv(kk))) e where e->>'id' = v_emp;
      elsif kk in ('ct-leaves', 'ct-advances') then
        select coalesce(jsonb_agg(e), '[]') into r from jsonb_array_elements(public.ct_arr(public.ct_kv(kk))) e where e->>'empId' = v_emp;
      elsif kk = 'ct-salary-sheets' and p_kind = 's' then
        select coalesce(jsonb_agg(jsonb_build_object('id', s->'id', 'month', s->'month', 'status', s->'status',
                 'rows', (select coalesce(jsonb_agg(jsonb_build_object('empId', x->'empId', 'name', x->'name', 'voucherId', x->'voucherId')), '[]')
                          from jsonb_array_elements(public.ct_arr(s->'rows')) x where x->>'empId' = v_emp))), '[]')
          into r from jsonb_array_elements(public.ct_arr(public.ct_kv(kk))) s where s->>'id' = split_part(p_id, '~', 1);
      elsif kk = 'ct-vouchers' then
        select coalesce(jsonb_agg(e), '[]') into r from jsonb_array_elements(public.ct_arr(public.ct_kv(kk))) e
          where position(p_id in e::text) > 0
             or e->>'id' in (select x->>'voucherId' from jsonb_array_elements(public.ct_arr(public.ct_kv('ct-salary-sheets'))) s,
                               jsonb_array_elements(public.ct_arr(s->'rows')) x
                             where p_kind = 's' and s->>'id' = split_part(p_id, '~', 1) and x->>'empId' = v_emp);
      end if;
    elsif p_kind = 'v' and kk = 'ct-vouchers' then
      select coalesce(jsonb_agg(e), '[]') into r from jsonb_array_elements(public.ct_arr(public.ct_kv(kk))) e where e->>'id' = p_id;
    end if;
    if r is not null then key := kk; value := r; return next; end if;
  end loop;
end $$;

-- ---------- who may call what ----------
revoke all on function public.ct_login_prepare(text, text) from public;
grant execute on function public.ct_login_prepare(text, text) to anon, authenticated;
grant execute on function public.ct_me() to authenticated;
grant execute on function public.portal_get(text[], text) to authenticated;
grant execute on function public.portal_put(text, jsonb) to authenticated;
grant execute on function public.public_get(text, text, text[], text) to anon, authenticated;
revoke all on function public.ct_cust_view(text, jsonb, text, boolean) from public, anon, authenticated;
revoke all on function public.ct_kv(text) from public, anon, authenticated;
revoke all on function public.ct_staff_list() from public, anon, authenticated;
grant execute on function public.ct_is_staff() to authenticated;
grant execute on function public.ct_my_customer() to authenticated;


-- ============================================================
-- PUBLIC WEBSITE (separate site, no login)
--   public_site()               → published content + product rates only
--   account_check(code, last4)  → one customer's summary, only if code + last 4 mobile digits match
--   web_request(name, phone, area, note) → "naya account" request into ct-web-requests
-- Nothing else is reachable from the website.
-- ============================================================
create table if not exists public.ct_web_attempts (id bigserial primary key, k text, ok boolean, at timestamptz default now());
alter table public.ct_web_attempts enable row level security;
create index if not exists ct_web_attempts_at on public.ct_web_attempts (at);
revoke all on public.ct_web_attempts from anon, authenticated;

create or replace function public.public_site() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare w jsonb; live jsonb; ids jsonb; prods jsonb; st jsonb;
begin
  w := public.ct_kv('ct-website');
  live := w->'live';
  if live is null or jsonb_typeof(live) <> 'object' then return jsonb_build_object('ok', false); end if;
  ids := coalesce(live->'rates'->'productIds', '[]'::jsonb);
  if jsonb_typeof(ids) <> 'array' then ids := '[]'::jsonb; end if;
  select coalesce(jsonb_agg(jsonb_build_object('id', e->'id', 'name', e->'name', 'unit', e->'unit', 'price', e->'price')), '[]')
    into prods from jsonb_array_elements(public.ct_arr(public.ct_kv('ct-products'))) e
    where (jsonb_array_length(ids) = 0 or ids ? (e->>'id')) and coalesce(e->>'active', 'true') <> 'false';
  st := coalesce(public.ct_kv('ct-settings'), '{}'::jsonb);
  return jsonb_build_object('ok', true, 'content', live, 'products', prods, 'publishedAt', w->'publishedAt',
    'company', jsonb_build_object('name', st->'companyName', 'phone', st->'companyPhone', 'address', st->'companyAddress'));
end $$;

create or replace function public.account_check(p_code text, p_last4 text) returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare
  v_k text := upper(regexp_replace(coalesce(p_code, ''), '\s', '', 'g'));
  v_d text := regexp_replace(coalesce(p_last4, ''), '\D', '', 'g');
  v_r jsonb; v_fail int; v_all int;
begin
  if v_k ~ '^C?T?-?C?-?\d{1,6}$' and v_k !~ '^CT-C-' then v_k := 'CT-C-' || regexp_replace(v_k, '\D', '', 'g'); end if;
  if v_k !~ '^CT-C-\d{1,6}$' or length(v_d) <> 4 then return jsonb_build_object('result', 'bad_input'); end if;
  v_k := 'CT-C-' || lpad(ltrim(substring(v_k from 6), '0'), 4, '0');
  select count(*) into v_fail from public.ct_web_attempts where k = v_k and not ok and at > now() - interval '30 minutes';
  select count(*) into v_all from public.ct_web_attempts where not ok and at > now() - interval '10 minutes';
  if v_fail >= 5 or v_all >= 120 then return jsonb_build_object('result', 'wait'); end if;
  v_r := public.ct_kv('ct-web-accounts') -> v_k;
  if v_r is null or coalesce(v_r->>'last4', '') <> v_d then
    insert into public.ct_web_attempts (k, ok) values (v_k, false);
    perform pg_sleep(0.4);
    return jsonb_build_object('result', 'not_found');
  end if;
  insert into public.ct_web_attempts (k, ok) values (v_k, true);
  delete from public.ct_web_attempts where at < now() - interval '2 days';
  if v_r->>'status' = 'Inactive' then return jsonb_build_object('result', 'inactive', 'code', v_k); end if;
  return jsonb_build_object('result', 'active', 'code', v_k, 'account', v_r - 'last4');
end $$;

create or replace function public.web_request(p_name text, p_phone text, p_area text default '', p_note text default '') returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare v_ph text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'); v_cur jsonb; v_n int; v_max int; v_code text; v_dup jsonb;
begin
  if length(trim(coalesce(p_name, ''))) < 2 or length(p_name) > 80 then return jsonb_build_object('ok', false, 'error', 'name'); end if;
  if v_ph ~ '^92\d{10}$' then v_ph := '0' || substring(v_ph from 3); end if;
  if v_ph !~ '^03\d{9}$' then return jsonb_build_object('ok', false, 'error', 'phone'); end if;
  perform pg_advisory_xact_lock(hashtext('ct-web-requests'));
  v_cur := public.ct_arr(public.ct_kv('ct-web-requests'));
  select e into v_dup from jsonb_array_elements(v_cur) e where e->>'phone' = v_ph and e->>'status' = 'Pending' limit 1;
  if v_dup is not null then return jsonb_build_object('ok', true, 'code', v_dup->>'code', 'dup', true); end if;
  select count(*) into v_n from jsonb_array_elements(v_cur) e where (e->>'at')::timestamptz > now() - interval '1 hour';
  if v_n >= 30 then return jsonb_build_object('ok', false, 'error', 'wait'); end if;
  select coalesce(max((regexp_replace(e->>'code', '\D', '', 'g'))::int), 0) into v_max from jsonb_array_elements(v_cur) e where e->>'code' ~ '^WR-\d+$';
  v_code := 'WR-' || lpad((v_max + 1)::text, 4, '0');
  insert into public.kv_store (key, value, updated_at)
  values ('ct-web-requests', v_cur || jsonb_build_array(jsonb_build_object('id', 'wr_' || substr(md5(random()::text || clock_timestamp()::text), 1, 12),
    'code', v_code, 'name', left(trim(p_name), 80), 'phone', v_ph, 'area', left(trim(coalesce(p_area, '')), 60),
    'note', left(trim(coalesce(p_note, '')), 200), 'status', 'Pending', 'at', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'))), now())
  on conflict (key) do update set value = excluded.value, updated_at = now();
  return jsonb_build_object('ok', true, 'code', v_code);
end $$;

grant execute on function public.public_site() to anon, authenticated;
grant execute on function public.account_check(text, text) to anon, authenticated;
grant execute on function public.web_request(text, text, text, text) to anon, authenticated;

-- ---------- payment-proof pictures (Storage) ----------
insert into storage.buckets (id, name, public) values ('payment-proofs', 'payment-proofs', false)
on conflict (id) do update set public = false;
drop policy if exists "ct proofs staff" on storage.objects;
create policy "ct proofs staff" on storage.objects for all to authenticated
  using (bucket_id = 'payment-proofs' and (select public.ct_is_staff()))
  with check (bucket_id = 'payment-proofs' and (select public.ct_is_staff()));

-- ---------- live sync ----------
do $$ begin
  alter publication supabase_realtime add table public.kv_store;
exception when others then null; end $$;
