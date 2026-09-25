import React, { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "./supabaseClient.js";

/* ============================================================
   GLOBAL BILINGUAL LANGUAGE SYSTEM
   Presentation-only: language state never changes stored ERP data,
   IDs, calculations, database keys, or business logic.
   ============================================================ */
const LANGUAGE_STORAGE_KEY = "ct-language";
const LANGUAGE_DEFAULT = "en";
let languageState = typeof window !== "undefined"
  ? (window.localStorage.getItem(LANGUAGE_STORAGE_KEY) || LANGUAGE_DEFAULT)
  : LANGUAGE_DEFAULT;
const languageListeners = new Set();

const translations = {
  en: {},
  ur: {
    "Dashboard": "ڈیش بورڈ",
    "Customers": "گاہک",
    "Invoices": "انوائسز",
    "Invoice History": "انوائس ہسٹری",
    "Sales Return": "فروخت واپسی",
    "Exchange": "تبادلہ",
    "Credit Notes": "کریڈٹ نوٹس",
    "Ledger": "لیجر",
    "Payments": "ادائیگیاں",
    "Outstanding Transfer": "بقایا منتقلی",
    "Adjustments": "ایڈجسٹمنٹس",
    "Advance Booking": "پیشگی بکنگ",
    "Daily Orders": "روزانہ آرڈرز",
    "Promise To Pay": "ادائیگی کا وعدہ",
    "Leads": "لیڈز",
    "Products": "مصنوعات",
    "Drivers": "ڈرائیورز",
    "Offers": "آفرز",
    "Reports": "رپورٹس",
    "Sales Assistant": "سیلز اسسٹنٹ",
    "Cement Estimator": "سیمنٹ کیلکولیٹر",
    "Settings": "ترتیبات",
    "Log out": "لاگ آؤٹ",
    "Log In": "لاگ اِن",
    "English": "انگریزی",
    "Language": "زبان",
    "Admin": "ایڈمن",
    "Staff": "اسٹاف",
    "User": "صارف",
    "Users (Admin / Staff)": "صارفین (ایڈمن / اسٹاف)",
    "Username": "صارف نام",
    "Password": "پاس ورڈ",
    "Name": "نام",
    "Full name": "پورا نام",
    "Phone": "فون",
    "Address": "پتہ",
    "Branch": "برانچ",
    "Branches": "برانچز",
    "Credit Limit": "کریڈٹ حد",
    "Credit Limit (Rs)": "کریڈٹ حد (روپے)",
    "Opening Balance": "ابتدائی بیلنس",
    "Opening Balance (Rs)": "ابتدائی بیلنس (روپے)",
    "Audience Type": "سامعین کی قسم",
    "Audience Type (for Sales Assistant)": "سامعین کی قسم (سیلز اسسٹنٹ کے لیے)",
    "Customer Portal Login (optional)": "کسٹمر پورٹل لاگ اِن (اختیاری)",
    "Portal Username": "پورٹل صارف نام",
    "Portal Password": "پورٹل پاس ورڈ",
    "Save Customer": "گاہک محفوظ کریں",
    "Save": "محفوظ کریں",
    "Cancel": "منسوخ کریں",
    "Edit": "ترمیم کریں",
    "Delete": "حذف کریں",
    "Add": "شامل کریں",
    "Update": "اپ ڈیٹ کریں",
    "Close": "بند کریں",
    "Print": "پرنٹ کریں",
    "Download": "ڈاؤن لوڈ کریں",
    "Download PDF": "پی ڈی ایف ڈاؤن لوڈ کریں",
    "Print / Save as PDF": "پرنٹ / پی ڈی ایف کے طور پر محفوظ کریں",
    "Search": "تلاش کریں",
    "View": "دیکھیں",
    "Back": "واپس",
    "Next": "اگلا",
    "Submit": "جمع کریں",
    "Confirm": "تصدیق کریں",
    "Reverse": "واپس کریں",
    "WhatsApp": "واٹس ایپ",
    "Send on WhatsApp": "واٹس ایپ پر بھیجیں",
    "Share on WhatsApp": "واٹس ایپ پر شیئر کریں",
    "Today's Sales": "آج کی فروخت",
    "This Month": "اس ماہ",
    "Total Outstanding": "کل بقایا",
    "Active Leads": "فعال لیڈز",
    "Open Bookings": "کھلی بکنگز",
    "Promise To Pay Overview": "ادائیگی کے وعدوں کا جائزہ",
    "Today's Promises": "آج کے وعدے",
    "Upcoming (7 Days)": "آئندہ (7 دن)",
    "Overdue Promises": "میعاد سے زائد وعدے",
    "Pending Promises": "زیرِ التوا وعدے",
    "Completed Promises": "مکمل وعدے",
    "Broken Promises": "ٹوٹے ہوئے وعدے",
    "Total Promised Amount": "وعدہ شدہ کل رقم",
    "Promise Customers": "وعدہ کرنے والے گاہک",
    "Recent Invoices": "حالیہ انوائسز",
    "Customer": "گاہک",
    "Select Customer": "گاہک منتخب کریں",
    "New Customer": "نیا گاہک",
    "Edit Customer": "گاہک میں ترمیم",
    "Search name or phone...": "نام یا فون تلاش کریں...",
    "No customer found": "کوئی گاہک نہیں ملا۔",
    "Outstanding": "بقایا",
    "Over limit": "حد سے زیادہ",
    "Customer Name": "گاہک کا نام",
    "Customer Name (optional)": "گاہک کا نام (اختیاری)",
    "Phone (with WhatsApp, e.g. 03001234567)": "فون (واٹس ایپ کے ساتھ، مثلاً 03001234567)",
    "Phone Number (optional)": "فون نمبر (اختیاری)",
    "Address (optional)": "پتہ (اختیاری)",
    "Customer Type": "گاہک کی قسم",
    "Cash Customer": "نقد گاہک",
    "Cash Customer / Walk-In": "نقد گاہک / واک اِن",
    "Regular Customer": "عام گاہک",
    "Regular Customer Invoice": "عام گاہک کی انوائس",
    "Cash Customer / Walk-In Invoice": "نقد گاہک / واک اِن انوائس",
    "Cash Customer / Walk-In Details (Optional)": "نقد گاہک / واک اِن کی تفصیلات (اختیاری)",
    "Customer account waisa hi rahega — sirf ye note hoga ke material kis ne collect kiya.": "گاہک کا اکاؤنٹ ویسا ہی رہے گا — صرف یہ نوٹ ہوگا کہ سامان کس نے وصول کیا۔",
    "Customer account, portal, credit limit ya outstanding ledger nahi banega — sirf cash sale invoice.": "گاہک کا اکاؤنٹ، پورٹل، کریڈٹ حد یا بقایا لیجر نہیں بنے گا — صرف نقد فروخت کی انوائس بنے گی۔",
    "Invoice": "انوائس",
    "New Invoice": "نئی انوائس",
    "Create New Invoice": "نئی انوائس بنائیں",
    "Invoice #": "انوائس نمبر",
    "Invoice Number": "انوائس نمبر",
    "Invoice Date": "انوائس کی تاریخ",
    "Date": "تاریخ",
    "Date:": "تاریخ:",
    "Date/Time": "تاریخ/وقت",
    "Product": "مصنوعہ",
    "Product Name": "مصنوعے کا نام",
    "Item": "آئٹم",
    "Item name": "آئٹم کا نام",
    "Items": "آئٹمز",
    "Quantity": "مقدار",
    "Qty": "مقدار",
    "Qty (Sold)": "فروخت شدہ مقدار",
    "Unit": "یونٹ",
    "Rate": "ریٹ",
    "Rate / Unit": "ریٹ / یونٹ",
    "Price": "قیمت",
    "Price (Rs)": "قیمت (روپے)",
    "Discount": "رعایت",
    "Discount (Rs)": "رعایت (روپے)",
    "Tax": "ٹیکس",
    "Total": "کل",
    "Grand Total": "کل رقم",
    "Subtotal": "ذیلی کل",
    "Paid": "ادا شدہ",
    "Unpaid": "غیر ادا شدہ",
    "Partial": "جزوی",
    "Balance": "بیلنس",
    "Payment": "ادائیگی",
    "Payment Received": "موصول شدہ ادائیگی",
    "Payment Received Now (Rs)": "اب موصول شدہ ادائیگی (روپے)",
    "Payment Method": "ادائیگی کا طریقہ",
    "Payment Received By": "ادائیگی وصول کرنے والا",
    "Notes": "نوٹس",
    "Note": "نوٹ",
    "Note (optional)": "نوٹ (اختیاری)",
    "Notes (optional)": "نوٹس (اختیاری)",
    "Invoice Status": "انوائس کی حالت",
    "Add Item": "+ آئٹم شامل کریں",
    "Remove Item": "آئٹم ہٹائیں",
    "Save Invoice": "انوائس محفوظ کریں",
    "Update Invoice": "انوائس اپ ڈیٹ کریں",
    "Cancel Invoice": "انوائس منسوخ کریں",
    "Details": "تفصیلات",
    "Status": "حالت",
    "Reference": "حوالہ",
    "Ref": "حوالہ",
    "Type": "قسم",
    "Debit": "ڈیبٹ",
    "Credit": "کریڈٹ",
    "Amount": "رقم",
    "Amount (Rs)": "رقم (روپے)",
    "Reason": "وجہ",
    "Reason / Note": "وجہ / نوٹ",
    "Remaining": "باقی",
    "Current Balance": "موجودہ بیلنس",
    "Previous Balance": "پچھلا بیلنس",
    "Customer Ledger": "گاہک کا لیجر",
    "Outstanding Balance": "بقایا بیلنس",
    "Return #": "واپسی نمبر",
    "Return Date": "واپسی کی تاریخ",
    "Return Qty": "واپسی کی مقدار",
    "Qty Returned": "واپس شدہ مقدار",
    "Return Reason": "واپسی کی وجہ",
    "Returned": "واپس کیا گیا",
    "Returned Value": "واپس شدہ رقم",
    "Exchange #": "تبادلہ نمبر",
    "Exchange Items": "تبادلے کے آئٹمز",
    "Exchange Reason": "تبادلے کی وجہ",
    "New Items Value": "نئے آئٹمز کی قیمت",
    "New Qty": "نئی مقدار",
    "Difference": "فرق",
    "Return/Exchange": "واپسی/تبادلہ",
    "Credit Note #": "کریڈٹ نوٹ نمبر",
    "Link to Invoice": "انوائس سے منسلک کریں",
    "Record Payment": "ادائیگی درج کریں",
    "Payment History": "ادائیگی کی تاریخ",
    "Transfer #": "منتقلی نمبر",
    "Transfer Amount (Rs)": "منتقلی کی رقم (روپے)",
    "Transfer Outstanding": "بقایا منتقلی",
    "From": "سے",
    "To": "کو",
    "From Customer": "منتقل کرنے والا گاہک",
    "To Customer": "وصول کرنے والا گاہک",
    "Adjustment": "ایڈجسٹمنٹ",
    "Adjustment History": "ایڈجسٹمنٹ ہسٹری",
    "Adjustment Type": "ایڈجسٹمنٹ کی قسم",
    "New Adjustment": "+ نئی ایڈجسٹمنٹ",
    "Edit Adjustment": "ایڈجسٹمنٹ میں ترمیم",
    "Adjustments Added": "شامل کی گئی ایڈجسٹمنٹس",
    "Adjustments Reduced": "کم کی گئی ایڈجسٹمنٹس",
    "Reduce Balance (-)": "بیلنس کم کریں (-)",
    "Add Balance (+)": "بیلنس بڑھائیں (+)",
    "New Advance Booking": "+ نئی پیشگی بکنگ",
    "Booking Date": "بکنگ کی تاریخ",
    "Advance": "پیشگی",
    "Advance Received": "موصول شدہ پیشگی",
    "Advance Received Now (Rs)": "اب موصول شدہ پیشگی (روپے)",
    "Remaining on Delivery": "ڈیلیوری پر باقی",
    "New Order": "نیا آرڈر",
    "Order Date (call received)": "آرڈر کی تاریخ (کال موصول ہونے کی تاریخ)",
    "New Promise": "نیا وعدہ",
    "Promise Amount (Rs)": "وعدہ شدہ رقم (روپے)",
    "Promise Amt": "وعدہ شدہ رقم",
    "Promise Date": "وعدے کی تاریخ",
    "Expected Payment Date": "متوقع ادائیگی کی تاریخ",
    "Promise History": "وعدوں کی ہسٹری",
    "Pending": "زیرِ التوا",
    "Partially Paid": "جزوی ادائیگی",
    "Completed": "مکمل",
    "Cancelled": "منسوخ",
    "Processing": "پروسیسنگ",
    "Broken Promise": "ٹوٹا ہوا وعدہ",
    "Deleted": "حذف شدہ",
    "Booked": "بک شدہ",
    "Partially Delivered": "جزوی ڈیلیوری",
    "Active": "فعال",
    "Reversed": "واپس کیا گیا",
    "Normal": "معمول",
    "Partially Returned": "جزوی واپسی",
    "Fully Returned": "مکمل واپسی",
    "Partially Exchanged": "جزوی تبادلہ",
    "Fully Exchanged": "مکمل تبادلہ",
    "Returned + Exchanged": "واپسی + تبادلہ",
    "Payment Against Promise": "وعدے کے مقابل ادائیگی",
    "Promise Created": "وعدہ بنایا گیا",
    "Outstanding Transfer In": "بقایا منتقلی اندر",
    "Outstanding Transfer Out": "بقایا منتقلی باہر",
    "New Lead": "نئی لیڈ",
    "Source": "ذریعہ",
    "Follow-up Date": "فالو اَپ تاریخ",
    "Requested For": "درخواست برائے",
    "Generated Message": "تیار کردہ پیغام",
    "Offer Text (scrolling ticker mein dikhega)": "آفر کا متن (اسکرولنگ ٹکر میں دکھائی دے گا)",
    "Offer banner": "آفر بینر",
    "No Banner": "کوئی بینر نہیں",
    "New Purchase": "نئی خریداری",
    "Category": "زمرہ",
    "New Driver": "نیا ڈرائیور",
    "Driver ID": "ڈرائیور آئی ڈی",
    "Driver Name": "ڈرائیور کا نام",
    "Vehicle": "گاڑی",
    "Vehicle Number": "گاڑی نمبر",
    "Vehicle Type": "گاڑی کی قسم",
    "Rickshaw + Delivery": "رکشہ + ڈیلیوری",
    "Rickshaw &amp; Delivery": "رکشہ اور ڈیلیوری",
    "Rickshaw &amp; Delivery Details": "رکشہ اور ڈیلیوری کی تفصیلات",
    "Rickshaw Rent (Rs)": "رکشہ کرایہ (روپے)",
    "Cement": "سیمنٹ",
    "Cement Rate (Rs/bag)": "سیمنٹ ریٹ (روپے/بیگ)",
    "Covered Area": "زیرِ تعمیر رقبہ",
    "Floors": "منزلیں",
    "Width (ft)": "چوڑائی (فٹ)",
    "Length (ft)": "لمبائی (فٹ)",
    "Family": "فیملی",
    "Mistri": "مستری",
    "Worker": "مزدور",
    "Sales in Range": "مدت میں فروخت",
    "Collected in Range": "مدت میں وصولی",
    "Total Invoices": "کل انوائسز",
    "Total Orders": "کل آرڈرز",
    "Total Return Amount": "واپسی کی کل رقم",
    "Total Value (Qty × Rate)": "کل قیمت (مقدار × ریٹ)",
    "Customers with Outstanding Balance": "بقایا بیلنس والے گاہک",
    "Audit Log": "آڈٹ لاگ",
    "Edit History": "ترمیم کی ہسٹری",
    "Edited By": "ترمیم کرنے والا",
    "Created By": "بنانے والا",
    "Created By:": "بنانے والا:",
    "Action": "کارروائی",
    "Complete": "مکمل کریں",
    "Convert to Invoice": "انوائس میں تبدیل کریں",
    "Select": "منتخب کریں",
    "Select Invoice": "انوائس منتخب کریں",
    "Custom Item": "حسبِ ضرورت آئٹم",
    "Custom item": "حسبِ ضرورت آئٹم",
    "Locked Rate": "مقررہ ریٹ",
    "Locked Rate (Rs/unit)": "مقررہ ریٹ (روپے/یونٹ)",
    "Valid Till": "درست تا",
    "Logo": "لوگو",
    "Company Info": "کمپنی کی معلومات",
    "Company Logo": "کمپنی کا لوگو",
    "Company Name": "کمپنی کا نام",
    "Construction Materials Supplier": "تعمیراتی مواد فراہم کنندہ",
    "Bill To": "بل برائے",
    "Calendar": "کیلنڈر",
    "Text": "متن",
    "Backup": "بیک اَپ",
    "Download Backup (JSON)": "بیک اَپ ڈاؤن لوڈ کریں (JSON)",
    "Restore from File": "فائل سے بحال کریں",
    "Roman Urdu": "رومن اردو",
    "Banner": "بینر",
    "Banner Image (optional)": "بینر کی تصویر (اختیاری)",
    "Loading...": "لوڈ ہو رہا ہے...",
    "Koi customer nahi mila.": "کوئی گاہک نہیں ملا۔",
    "Customer Ko Kya Naya Mil Raha Hai": "گاہک کو کیا نیا مل رہا ہے",
    "Customer Kya Wapis Kar Raha Hai (Remaining Qty se zyada nahi; decimal allowed)": "گاہک کیا واپس کر رہا ہے (باقی مقدار سے زیادہ نہیں؛ اعشاریہ کی اجازت ہے)",
    "Items — Return Qty Daalein (Remaining Qty se zyada nahi; decimal allowed, e.g. 6.5)": "آئٹمز — واپسی کی مقدار درج کریں (باقی مقدار سے زیادہ نہیں؛ اعشاریہ کی اجازت ہے، مثلاً 6.5)",
    "Delete Reason": "حذف کرنے کی وجہ",
    "Confirm Delete": "حذف کرنے کی تصدیق",
    "Confirm Reverse": "واپس کرنے کی تصدیق",
    "Reason likhna zaroori hai.": "وجہ درج کرنا ضروری ہے۔",
    "Reverse ki wajah likhein.": "واپس کرنے کی وجہ درج کریں۔",
    "Delete ki wajah likhein.": "حذف کرنے کی وجہ درج کریں۔",
    "Pehle Customers tab mein customer add karein.": "پہلے گاہکوں کے ٹیب میں گاہک شامل کریں۔",
    "Pehle koi customer add karein.": "پہلے کوئی گاہک شامل کریں۔",
    "Pehle invoice select karein.": "پہلے انوائس منتخب کریں۔",
    "Koi adjustment nahi hua abhi tak.": "ابھی تک کوئی ایڈجسٹمنٹ نہیں ہوئی۔",
    "Koi adjustment nahi.": "کوئی ایڈجسٹمنٹ نہیں۔",
    "Koi advance booking nahi.": "کوئی پیشگی بکنگ نہیں۔",
    "Koi branch nahi bani.": "ابھی کوئی برانچ نہیں بنی۔",
    "Koi credit note nahi bani.": "کوئی کریڈٹ نوٹ نہیں بنی۔",
    "Koi driver add nahi hua.": "کوئی ڈرائیور شامل نہیں کیا گیا۔",
    "Koi entry nahi.": "کوئی اندراج نہیں۔",
    "Koi exchange record nahi.": "کوئی تبادلے کا ریکارڈ نہیں۔",
    "Koi invoice nahi bana abhi tak.": "ابھی تک کوئی انوائس نہیں بنی۔",
    "Koi invoice nahi bana.": "کوئی انوائس نہیں بنی۔",
    "Koi invoice nahi.": "کوئی انوائس نہیں۔",
    "Koi offer nahi bana.": "کوئی آفر نہیں بنی۔",
    "Koi order nahi.": "کوئی آرڈر نہیں۔",
    "Koi outstanding nahi.": "کوئی بقایا نہیں۔",
    "Koi outstanding transfer nahi hua abhi tak.": "ابھی تک کوئی بقایا منتقلی نہیں ہوئی۔",
    "Koi payment record nahi.": "کوئی ادائیگی کا ریکارڈ نہیں۔",
    "Koi product nahi.": "کوئی مصنوعات نہیں۔",
    "Koi promise nahi mila.": "کوئی وعدہ نہیں ملا۔",
    "Koi promise nahi.": "کوئی وعدہ نہیں۔",
    "Koi record nahi.": "کوئی ریکارڈ نہیں۔",
    "Koi return record nahi.": "کوئی واپسی کا ریکارڈ نہیں۔",
    "Abhi tak koi audit entry nahi.": "ابھی تک کوئی آڈٹ اندراج نہیں۔",
    "Abhi tak koi edit ya cancellation nahi hui.": "ابھی تک کوئی ترمیم یا منسوخی نہیں ہوئی۔",
    "Account nahi mila, admin se rabta karein.": "اکاؤنٹ نہیں ملا، ایڈمن سے رابطہ کریں۔",
    "Galat username ya password.": "غلط صارف نام یا پاس ورڈ۔",
    "Default logins wapas set ho gaye: admin/admin123, staff/staff123. Ab dobara try karein.": "ڈیفالٹ لاگ اِن دوبارہ سیٹ ہو گئے ہیں: admin/admin123، staff/staff123۔ اب دوبارہ کوشش کریں۔",
    "Today": "آج",
    "Tomorrow": "کل",
    "This Week": "اس ہفتے",
    "All Status": "تمام حالتیں",
    "All": "سب",
    "Regular": "عام",
    "Cash": "نقد",
    "Bank": "بینک",
    "Online": "آن لائن",
    "Cheque": "چیک",
    "Other": "دیگر",
    "Builder": "بلڈر",
    "Contractor": "ٹھیکیدار",
    "Developer": "ڈویلپر",
    "Housing Society": "ہاؤسنگ سوسائٹی",
    "New": "نیا",
    "Contacted": "رابطہ کیا گیا",
    "Qualified": "اہل قرار دیا گیا",
    "Won": "کامیاب",
    "Lost": "ضائع شدہ",
    "Trip": "ٹرپ",
    "Bag": "بیگ",
    "Ton": "ٹن",
    "Sq.Ft": "مربع فٹ",
    "Piece": "عدد",
    "Feet": "فٹ",
    "Meter": "میٹر",
    "KG": "کلوگرام",
    "Liter": "لیٹر",
    "Rickshaw": "رکشہ",
    "Truck": "ٹرک",
    "Mazda": "مزدا",
    "Loader Rickshaw": "لوڈر رکشہ",
    "Due": "واجب الادا",
    "Expired": "میعاد ختم",
    "Search customer...": "گاہک تلاش کریں...",
    "Search customer / adj # / category...": "گاہک / ایڈجسٹمنٹ نمبر / زمرہ تلاش کریں...",
    "Search customer / promise # / amount / status...": "گاہک / وعدہ نمبر / رقم / حالت تلاش کریں...",
    "Search INV-xxxx / RET-xxxx-xx / EX-xxxx-xx / PTP-xxxx / OT-xxxx / ADJ-xxxx...": "INV-xxxx / RET-xxxx-xx / EX-xxxx-xx / PTP-xxxx / OT-xxxx / ADJ-xxxx تلاش کریں...",
    "e.g. Crush": "مثلاً کرش",
    "e.g. Aslam": "مثلاً اسلم",
    "e.g. DRV-0001": "مثلاً DRV-0001",
    "e.g. Delivery charges adjustment": "مثلاً ڈیلیوری چارجز ایڈجسٹمنٹ",
    "e.g. Extra order ho gaya tha": "مثلاً اضافی آرڈر ہو گیا تھا",
    "e.g. Is hafte cement par Rs 50/bag discount!": "مثلاً اس ہفتے سیمنٹ پر 50 روپے فی بیگ رعایت!",
    "e.g. Kal Subah, Aaj Shaam": "مثلاً کل صبح، آج شام",
    "e.g. LEA-1234": "مثلاً LEA-1234",
    "Mobile": "موبائل",
    "Mobile Number (Optional)": "موبائل نمبر (اختیاری)",
    "Expected Date": "متوقع تاریخ",
    "Apply Against Promise (optional)": "وعدے کے مقابل لاگو کریں (اختیاری)",
    "None — general payment": "کوئی نہیں — عمومی ادائیگی",
    "No record found": "کوئی ریکارڈ نہیں ملا۔",
    "Welcome,": "خوش آمدید،",
    "· All Branches": "· تمام برانچز",
    "· Created Date:": "· تخلیق کی تاریخ:",
    "Sirf image file (PNG/JPG) upload karein.": "صرف تصویر کی فائل (PNG/JPG) اپ لوڈ کریں۔",
    "Logo invoice header aur sidebar par nazar aayega. Chota, square-ish image behtar rahega.": "لوگو انوائس کے ہیڈر اور سائڈبار پر نظر آئے گا۔ چھوٹی، تقریباً مربع تصویر بہتر رہے گی۔",
    "Rate lock hai — is item ka daam invoice mein change na karein, warna customer se galat charge hoga.": "ریٹ مقرر ہے — اس آئٹم کی قیمت انوائس میں تبدیل نہ کریں، ورنہ گاہک سے غلط رقم وصول ہوگی۔",
    "Ye promise delete karne se ledger se bhi hat jayega. Ye action reverse nahi ho sakta.": "یہ وعدہ حذف کرنے سے لیجر سے بھی ختم ہو جائے گا۔ یہ کارروائی واپس نہیں کی جا سکتی۔",
    "Ye return delete karne se ledger reverse ho jayega, invoice qty aur customer balance wapis restore ho jayega.": "یہ واپسی حذف کرنے سے لیجر واپس درست ہو جائے گا، انوائس کی مقدار اور گاہک کا بیلنس بحال ہو جائے گا۔",
        "Amount 0 se zyada hona chahiye.": "رقم صفر سے زیادہ ہونی چاہیے۔",
    "Backup restore ho gaya.": "بیک اَپ بحال ہو گیا ہے۔",
    "Banner upload nahi ho saka, dobara try karein.": "بینر اپ لوڈ نہیں ہو سکا، دوبارہ کوشش کریں۔",
    "Customer aur amount zaroori hai.": "گاہک اور رقم درج کرنا ضروری ہے۔",
    "Customer select karein.": "گاہک منتخب کریں۔",
    "Driver ka naam zaroori hai.": "ڈرائیور کا نام درج کرنا ضروری ہے۔",
    "Exchange ki wajah likhein.": "تبادلے کی وجہ درج کریں۔",
    "Expected Payment Date zaroori hai.": "متوقع ادائیگی کی تاریخ درج کرنا ضروری ہے۔",
    "From aur To Customer same nahi ho sakte.": "منتقل کرنے والا اور وصول کرنے والا گاہک ایک جیسے نہیں ہو سکتے۔",
    "From aur To Customer select karein.": "منتقل کرنے والا اور وصول کرنے والا گاہک منتخب کریں۔",
    "Kam az kam ek item add karein.": "کم از کم ایک آئٹم شامل کریں۔",
    "Kam az kam ek item ki return qty daalein.": "کم از کم ایک آئٹم کی واپسی کی مقدار درج کریں۔",
    "Kam az kam ek naya item daalein jo customer ko diya ja raha hai.": "کم از کم ایک نیا آئٹم درج کریں جو گاہک کو دیا جا رہا ہے۔",
    "Kam az kam ek returned item ki qty daalein.": "کم از کم ایک واپس شدہ آئٹم کی مقدار درج کریں۔",
    "Koi invoice, return, exchange, promise, transfer ya adjustment is number se nahi mila.": "اس نمبر سے کوئی انوائس، واپسی، تبادلہ، وعدہ، منتقلی یا ایڈجسٹمنٹ نہیں ملی۔",
    "Offer ka text zaroori hai.": "آفر کا متن درج کرنا ضروری ہے۔",
    "Pehle customer select karein.": "پہلے گاہک منتخب کریں۔",
    "Promise amount zaroori hai.": "وعدے کی رقم درج کرنا ضروری ہے۔",
    "Qty aur Locked Rate zaroori hai.": "مقدار اور مقررہ ریٹ درج کرنا ضروری ہے۔",
    "Qty zaroori hai.": "مقدار درج کرنا ضروری ہے۔",
    "Return ki wajah likhein.": "واپسی کی وجہ درج کریں۔",
    "Return qty remaining quantity se zyada nahi ho sakti.": "واپسی کی مقدار باقی مقدار سے زیادہ نہیں ہو سکتی۔",
    "Returned qty remaining quantity se zyada nahi ho sakti.": "واپس شدہ مقدار باقی مقدار سے زیادہ نہیں ہو سکتی۔",
    "Sirf Admin promise cancel kar sakta hai.": "صرف ایڈمن وعدہ منسوخ کر سکتا ہے۔",
    "Transfer amount 0 se zyada hona chahiye.": "منتقلی کی رقم صفر سے زیادہ ہونی چاہیے۔",
    "Transfer amount From Customer ke current outstanding se zyada nahi ho sakta.": "منتقلی کی رقم منتقل کرنے والے گاہک کے موجودہ بقایا سے زیادہ نہیں ہو سکتی۔",
    "Ye file valid backup nahi hai.": "یہ فائل درست بیک اَپ نہیں ہے۔",
    "Ye invoice fully returned ho chuki hai. Nayi invoice banayein.": "یہ انوائس مکمل طور پر واپس ہو چکی ہے۔ نئی انوائس بنائیں۔",
    "Ye invoice fully returned/exchanged ho chuki hai. Nayi invoice banayein.": "یہ انوائس مکمل طور پر واپس/تبادلہ ہو چکی ہے۔ نئی انوائس بنائیں۔",
    "This Sales Return has linked Exchange records. Delete the Exchange first.": "اس فروخت واپسی کے ساتھ تبادلے کے ریکارڈ منسلک ہیں۔ پہلے تبادلہ حذف کریں۔",
    "Change": "تبدیل کریں",
    "Upload": "اپ لوڈ کریں",
    "Remove": "ہٹائیں",
    "Add Branch": "+ برانچ شامل کریں",
    "Add Item": "+ آئٹم شامل کریں",
    "Add User": "+ صارف شامل کریں",
    "Adjustment": "+ ایڈجسٹمنٹ",
    "New Advance Booking": "+ نئی پیشگی بکنگ",
    "New Customer": "+ نیا گاہک",
    "New Driver": "+ نیا ڈرائیور",
    "New Invoice": "+ نئی انوائس",
    "New Lead": "+ نئی لیڈ",
    "New Offer": "+ نئی آفر",
    "New Order": "+ نیا آرڈر",
    "New Outstanding Transfer": "+ نئی بقایا منتقلی",
    "New Promise": "+ نیا وعدہ",
    "Download Backup (JSON)": "بیک اَپ ڈاؤن لوڈ کریں (JSON)",
    "Restore from File": "فائل سے بحال کریں",
    "Active (customer portal mein dikhaya jaye)": "فعال (کسٹمر پورٹل میں دکھایا جائے)",
    "Offer Text (scrolling ticker mein dikhega)": "آفر کا متن (اسکرولنگ ٹکر میں دکھایا جائے گا)",
        "Portal": "پورٹل",
    "Trading Ledger": "ٹریڈنگ لیجر",
    "Copied!": "کاپی ہو گیا!",
    "Copy Text": "متن کاپی کریں",
    "Is customer ka phone number nahi hai — WhatsApp link kaam nahi karega jab tak add na karein.": "اس گاہک کا فون نمبر موجود نہیں ہے — واٹس ایپ لنک اس وقت تک کام نہیں کرے گا جب تک نمبر شامل نہ کیا جائے۔",
    "Is customer ka phone number save nahi hai — WhatsApp share ke liye Customers tab mein add karein.": "اس گاہک کا فون نمبر محفوظ نہیں ہے — واٹس ایپ پر شیئر کرنے کے لیے گاہکوں کے ٹیب میں نمبر شامل کریں۔",
    "Export Excel (CSV)": "ایکسِل برآمد کریں (CSV)",
    "Export PDF": "پی ڈی ایف برآمد کریں",
    "My Invoices": "میری انوائسز",
    "My Ledger": "میرا لیجر",
    "Payment History": "ادائیگی کی تاریخ",
    "Invoice Details": "انوائس کی تفصیلات",
    "Download Invoice": "انوائس ڈاؤن لوڈ کریں",
    "Profile": "پروفائل",
    "Unpaid": "غیر ادا شدہ",
    "Remaining": "باقی",
    "Commission": "کمیشن",
    "Commission Dashboard": "کمیشن ڈیش بورڈ",
    "Commission Agents": "کمیشن ایجنٹس",
    "Commission Agent": "کمیشن ایجنٹ",
    "Commission Agent (Optional)": "کمیشن ایجنٹ (اختیاری)",
    "Commission Rules": "کمیشن رولز",
    "Commission Rule": "کمیشن رول",
    "Commission History": "کمیشن ہسٹری",
    "Commission Ledger": "کمیشن لیجر",
    "Commission Payment History": "کمیشن ادائیگی کی تاریخ",
    "New Agent": "+ نیا ایجنٹ",
    "Edit Agent": "ایجنٹ میں ترمیم",
    "Save Agent": "ایجنٹ محفوظ کریں",
    "New Rule": "+ نیا رول",
    "Edit Rule": "رول میں ترمیم",
    "Save Rule": "رول محفوظ کریں",
    "Agent Name": "ایجنٹ کا نام",
    "Default Commission": "ڈیفالٹ کمیشن",
    "Commission Type": "کمیشن کی قسم",
    "Commission Rate": "کمیشن ریٹ",
    "Commission Amount": "کمیشن رقم",
    "Percentage": "فیصد",
    "Fixed Amount": "مقررہ رقم",
    "Per Bag": "فی بیگ",
    "Per Item": "فی آئٹم",
    "Pay Commission": "کمیشن ادا کریں",
    "Payment Amount": "ادائیگی کی رقم",
    "Payment Date": "ادائیگی کی تاریخ",
    "Payment Method": "ادائیگی کا طریقہ",
    "Reference Number": "حوالہ نمبر",
    "Total Commission": "کل کمیشن",
    "Already Paid": "پہلے سے ادا شدہ",
    "Remaining Commission": "باقی کمیشن",
    "Outstanding Commission": "بقایا کمیشن",
    "Pending Commission": "زیرِ التوا کمیشن",
    "Approved Commission": "منظور شدہ کمیشن",
    "Paid Commission": "ادا شدہ کمیشن",
    "This Month Commission": "اس ماہ کا کمیشن",
    "Minimum Sale Amount": "کم از کم فروخت کی رقم",
    "Maximum Commission": "زیادہ سے زیادہ کمیشن",
    "All Products": "تمام مصنوعات",
    "Inactive": "غیر فعال",
    "Online Transfer": "آن لائن ٹرانسفر",
    "Agent-wise": "بلحاظ ایجنٹ",
    "Date-wise": "بلحاظ تاریخ",
    "Product-wise": "بلحاظ مصنوعہ",
    "Customer-wise": "بلحاظ گاہک",
    "Commission Reports": "کمیشن رپورٹس",
    "Recent Commission Transactions": "حالیہ کمیشن ٹرانزیکشنز",
    "Custom Range": "حسبِ ضرورت مدت",
  },
};

const statusTranslations = {
  "Pending": "زیرِ التوا",
  "Completed": "مکمل",
  "Cancelled": "منسوخ",
  "Processing": "پروسیسنگ",
  "Builder": "بلڈر",
  "Contractor": "ٹھیکیدار",
  "Developer": "ڈویلپر",
  "Housing Society": "ہاؤسنگ سوسائٹی",
  "New": "نیا",
  "Contacted": "رابطہ کیا گیا",
  "Qualified": "اہل قرار دیا گیا",
  "Won": "کامیاب",
  "Lost": "ضائع شدہ",
  "Booked": "بک شدہ",
  "Partially Delivered": "جزوی ڈیلیوری",
  "Partially Paid": "جزوی ادائیگی",
  "Broken Promise": "ٹوٹا ہوا وعدہ",
  "Active": "فعال",
  "Reversed": "واپس کیا گیا",
  "Deleted": "حذف شدہ",
  "Normal": "معمول",
  "Partially Returned": "جزوی واپسی",
  "Fully Returned": "مکمل واپسی",
  "Partially Exchanged": "جزوی تبادلہ",
  "Fully Exchanged": "مکمل تبادلہ",
  "Returned + Exchanged": "واپسی + تبادلہ",
  "Approved": "منظور شدہ",
  "Inactive": "غیر فعال",
};

function t(key) {
  const source = String(key ?? "");
  if (languageState === "en") return source;
  return translations.ur[source] || statusTranslations[source] || source;
}

function tStatus(status) {
  return languageState === "ur" ? (statusTranslations[status] || t(status)) : status;
}

function subscribeLanguage(listener) {
  languageListeners.add(listener);
  return () => languageListeners.delete(listener);
}

function setLanguage(language) {
  const next = language === "ur" ? "ur" : "en";
  languageState = next;
  try { window.localStorage.setItem(LANGUAGE_STORAGE_KEY, next); } catch {}
  languageListeners.forEach((listener) => listener(next));
}

function useLanguage() {
  const [language, setLocalLanguage] = useState(languageState);
  useEffect(() => subscribeLanguage(setLocalLanguage), []);
  return { language, setLanguage };
}

function LanguageSwitcher({ compact = false }) {
  const { language } = useLanguage();
  return (
    <div className={`inline-flex items-center border border-slate-300 bg-white ${compact ? "text-[10px]" : "text-xs"} font-bold uppercase tracking-wide`} dir="ltr">
      <button
        type="button"
        onClick={() => setLanguage("en")}
        className={`px-2.5 py-1.5 transition-colors ${language === "en" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}
      >
        English
      </button>
      <span className="text-slate-300">|</span>
      <button
        type="button"
        onClick={() => setLanguage("ur")}
        className={`px-2.5 py-1.5 transition-colors ${language === "ur" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}
      >
        اردو
      </button>
    </div>
  );
}

/*
 * Existing ERP components contain many legacy literal JSX strings. This
 * presentation bridge translates those exact UI strings without touching
 * customer/product/company-entered data, stored values, calculations, or IDs.
 * New/edited UI should use t(key) directly.
 */
function I18nDomBridge() {
  const { language } = useLanguage();

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.dir = language === "ur" ? "rtl" : "ltr";
    document.documentElement.lang = language === "ur" ? "ur" : "en";
    document.body.dir = language === "ur" ? "rtl" : "ltr";
    document.body.style.fontFamily = language === "ur"
      ? '"Noto Naskh Arabic", "Noto Nastaliq Urdu", Arial, sans-serif'
      : 'Inter, Arial, sans-serif';

    // Build a reverse dictionary as well, so switching back to English
    // restores the original UI text instead of leaving translated strings behind.
    const urduToEnglish = {};
    Object.entries(translations.ur || {}).forEach(([english, urdu]) => {
      if (urdu && urdu !== english && urduToEnglish[urdu] == null) urduToEnglish[urdu] = english;
    });
    Object.entries(statusTranslations || {}).forEach(([english, urdu]) => {
      if (urdu && urdu !== english && urduToEnglish[urdu] == null) urduToEnglish[urdu] = english;
    });

    const translateValue = (value) => {
      if (!value) return value;
      if (language === "ur") return translations.ur[value] || statusTranslations[value] || value;
      return urduToEnglish[value] || value;
    };

    const root = document.body;
    const shouldSkip = (node) => {
      const el = node.parentElement;
      if (!el) return true;
      const tag = el.tagName;
      return ["SCRIPT", "STYLE", "TEXTAREA"].includes(tag) ||
        (tag === "INPUT" && !["button", "submit"].includes((el.type || "").toLowerCase()));
    };

    const translate = () => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      const nodes = [];
      let node;
      while ((node = walker.nextNode())) nodes.push(node);
      nodes.forEach((textNode) => {
        if (shouldSkip(textNode)) return;
        const raw = textNode.nodeValue || "";
        const trimmed = raw.trim();
        if (!trimmed || trimmed.length > 180) return;
        const translated = translateValue(trimmed);
        if (translated !== trimmed) {
          textNode.nodeValue = raw.replace(trimmed, translated);
        }
      });

      root.querySelectorAll("input[placeholder], textarea[placeholder], [title], [aria-label]").forEach((el) => {
        ["placeholder", "title", "aria-label"].forEach((attr) => {
          if (!el.hasAttribute(attr)) return;
          const value = el.getAttribute(attr);
          if (value && value.length < 180) {
            const translated = translateValue(value);
            if (translated !== value) el.setAttribute(attr, translated);
          }
        });
      });
    };

    // React may repaint literal English strings after the language state changes,
    // so translate after paint and whenever new UI nodes are inserted.
    const raf = requestAnimationFrame(translate);
    const observer = new MutationObserver(() => requestAnimationFrame(translate));
    observer.observe(root, { childList: true, subtree: true });
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [language]);

  return null;
}


/* ============================================================
   CHAUDHARY TRADERS — Browser ERP (Phase 1 + Phase 2 + Phase 3)
   Data persists via Supabase (shared across all devices) when
   configured, otherwise falls back to the browser's localStorage
   (see storeGet/storeSet below).
   ============================================================ */

const UNIT_OPTS = ["Bag", "Ton", "Trip", "Sq.Ft", "Piece", "Feet", "Meter", "KG", "Liter"];
const LEAD_STATUSES = ["New", "Contacted", "Qualified", "Won", "Lost"];
const BOOKING_STATUSES = ["Booked", "Partially Delivered", "Completed", "Cancelled"];
const ORDER_STATUSES = ["Pending", "Processing", "Completed", "Cancelled"];
const AUDIENCE_TYPES = ["Builder", "Contractor", "Developer", "Housing Society"];
const VEHICLE_TYPES = ["Rickshaw", "Truck", "Mazda", "Loader Rickshaw", "Other"];
const PROMISE_STATUSES = ["Pending", "Partially Paid", "Completed", "Broken Promise", "Cancelled"];
const PROMISE_PAYMENT_METHODS = ["Cash", "Bank", "Online", "Cheque", "Other"];

const MESSAGE_TEMPLATES = {
  en: {
    Builder: (n, o) => `Assalam-o-Alaikum ${n},\n\nThis is Chaudhary Traders. We supply cement, bricks, sand and crush at competitive rates with reliable on-site delivery for your ongoing projects.${o > 0 ? `\n\nQuick reminder — your current outstanding balance is Rs ${o.toLocaleString()}. Kindly clear it at your convenience.` : ""}\n\nLet us know your next material requirement and we'll send a quote right away.`,
    Contractor: (n, o) => `Assalam-o-Alaikum ${n},\n\nChaudhary Traders here — bulk rates available on cement and building material for your sites, with same-day rickshaw/truck delivery.${o > 0 ? `\n\nAlso, a friendly reminder that Rs ${o.toLocaleString()} is outstanding on your account.` : ""}\n\nReply with your next order and we'll process it immediately.`,
    Developer: (n, o) => `Assalam-o-Alaikum ${n},\n\nFor your development project, Chaudhary Traders can offer volume pricing and a dedicated delivery schedule across all phases.${o > 0 ? `\n\nOutstanding balance on file: Rs ${o.toLocaleString()}.` : ""}\n\nHappy to set up a standing supply arrangement — let us know a good time to discuss.`,
    "Housing Society": (n, o) => `Assalam-o-Alaikum ${n},\n\nChaudhary Traders is offering society-wide supply rates for cement, bricks and sand for common infrastructure work.${o > 0 ? `\n\nOutstanding balance: Rs ${o.toLocaleString()}.` : ""}\n\nWe'd be glad to prepare a bulk quotation for the society.`,
  },
  ur: {
    Builder: (n, o) => `السلام علیکم ${n}،\n\nیہ چوہدری ٹریڈرز ہے۔ ہم سیمنٹ، اینٹیں، ریت اور کرش مناسب نرخوں پر فراہم کرتے ہیں، اور آپ کے جاری منصوبوں کے لیے قابلِ اعتماد سائٹ ڈیلیوری بھی فراہم کرتے ہیں۔${o > 0 ? `\n\nیاد دہانی — آپ کے اکاؤنٹ میں موجودہ بقایا رقم Rs ${o.toLocaleString()} ہے۔ براہِ کرم اپنی سہولت کے مطابق ادا کر دیں۔` : ""}\n\nاپنی اگلی تعمیراتی ضرورت بتائیں، ہم فوراً ریٹ بھیج دیں گے۔`,
    Contractor: (n, o) => `السلام علیکم ${n}،\n\nچوہدری ٹریڈرز کی طرف سے — سیمنٹ اور تعمیراتی سامان پر بلک ریٹس دستیاب ہیں، ساتھ ہی اسی دن رکشہ/ٹرک ڈیلیوری کی سہولت موجود ہے۔${o > 0 ? `\n\nآپ کے اکاؤنٹ میں Rs ${o.toLocaleString()} بقایا ہیں، براہِ کرم ادائیگی کر دیں۔` : ""}\n\nاپنا اگلا آرڈر جواب میں بھیج دیں، ہم فوراً کارروائی کریں گے۔`,
    Developer: (n, o) => `السلام علیکم ${n}،\n\nآپ کے ڈویلپمنٹ منصوبے کے لیے چوہدری ٹریڈرز تمام مراحل کے لیے بلک قیمت اور مخصوص ڈیلیوری شیڈول فراہم کر سکتا ہے۔${o > 0 ? `\n\nآپ کے اکاؤنٹ میں بقایا رقم: Rs ${o.toLocaleString()}۔` : ""}\n\nمسلسل سپلائی کے انتظام پر بات کرنے کے لیے مناسب وقت بتا دیں۔`,
    "Housing Society": (n, o) => `السلام علیکم ${n}،\n\nچوہدری ٹریڈرز ہاؤسنگ سوسائٹی کے لیے سیمنٹ، اینٹوں اور ریت پر خصوصی بلک ریٹس فراہم کر رہا ہے۔${o > 0 ? `\n\nبقایا رقم: Rs ${o.toLocaleString()}۔` : ""}\n\nسوسائٹی کے لیے بلک کوٹیشن تیار کر دیتے ہیں، براہِ کرم بتائیں۔`,
  },
};

function waLink(phone, text) {
  const clean = (phone || "").replace(/[^0-9]/g, "");
  const withCountry = clean.startsWith("92") ? clean : clean.startsWith("0") ? "92" + clean.slice(1) : "92" + clean;
  return `https://wa.me/${withCountry}?text=${encodeURIComponent(text)}`;
}

function uid(prefix) {
  return prefix + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function addOneMonth(dateStr) {
  const d = new Date(dateStr || todayISO());
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().slice(0, 10);
}
function fmtMoney(n) {
  const v = Number(n) || 0;
  return "Rs " + v.toLocaleString("en-PK", { maximumFractionDigits: 0 });
}
function fmtDate(d) {
  if (!d) return "-";
  const dt = new Date(d);
  return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtDateTime(d) {
  if (!d) return "-";
  const dt = new Date(d);
  return dt.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ---- Quantity / money rounding helpers -----------------------------------
// Partial-quantity products (Feet, Meter, KG, Liter, Sq.Ft) are frequently
// returned/exchanged in fractional amounts (e.g. 6 feet out of 39 feet
// sold). Plain floating point arithmetic on these fractions produces
// visible drift (e.g. 32.999999999996 instead of 33), so every quantity
// and every derived money amount coming out of a partial-qty calculation
// is rounded through these two helpers before it is stored or displayed.
function roundQty(n, decimals = 3) {
  const v = Number(n) || 0;
  const factor = Math.pow(10, decimals);
  return Math.round((v + Number.EPSILON) * factor) / factor;
}
function roundMoney(n) {
  const v = Number(n) || 0;
  return Math.round((v + Number.EPSILON) * 100) / 100;
}
function fmtQty(n) {
  const v = roundQty(n, 3);
  if (Number.isInteger(v)) return String(v);
  return String(parseFloat(v.toFixed(3)));
}

// Storage layer.
// If Supabase is configured (see src/supabaseClient.js + .env), data is
// stored in a shared "kv_store" table so admin + staff on ANY device see
// the same live data (synced in real time). If Supabase is NOT configured,
// the app falls back to the browser's localStorage (data stays on that
// device/browser only) so it still works out of the box.
const LS_PREFIX = "chaudhary_traders_erp:";

async function storeGet(key, fallback) {
  if (supabase) {
    try {
      const { data, error } = await supabase.from("kv_store").select("value").eq("key", key).maybeSingle();
      if (error) throw error;
      return data ? data.value : fallback;
    } catch (e) {
      console.error("supabase get failed, falling back to localStorage", key, e);
    }
  }
  try {
    const raw = window.localStorage.getItem(LS_PREFIX + key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
async function storeSet(key, value) {
  if (supabase) {
    try {
      const { error } = await supabase.from("kv_store").upsert({ key, value, updated_at: new Date().toISOString() });
      if (error) throw error;
      return;
    } catch (e) {
      console.error("supabase set failed, falling back to localStorage", key, e);
    }
  }
  try {
    window.localStorage.setItem(LS_PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.error("storage set failed", key, e);
  }
}

const DEFAULT_USERS = [
  { id: uid("u"), username: "admin", password: "admin123", role: "admin", name: "Admin" },
  { id: uid("u"), username: "staff", password: "staff123", role: "staff", name: "Staff" },
];
const DEFAULT_SETTINGS = {
  companyName: "Chaudhary Traders",
  companyAddress: "Lahore, Pakistan",
  companyPhone: "",
  invoiceCounter: 1,
  driverCounter: 1,
  bookingCounter: 1,
  orderCounter: 1,
  returnCounter: 1,
  exchangeCounter: 1,
  creditNoteCounter: 1,
  promiseCounter: 1,
  transferCounter: 1,
  adjustmentCounter: 1,
  logoUrl: "",
};
const DEFAULT_BRANCHES = [{ id: "branch_main", name: "Main Branch" }];

function resizeImageToDataUrl(file, maxWidth) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/png", 0.9));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

/* ---------------- Shell / Layout ---------------- */

function Sidebar({ page, setPage, role, onLogout, companyName, logoUrl }) {
  const items = [
    { id: "dashboard", label: "Dashboard", icon: "◧" },
    { id: "customers", label: "Customers", icon: "◍" },
    { id: "invoices", label: "Invoices", icon: "▤" },
    { id: "invoiceHistory", label: "Invoice History", icon: "🕓" },
    { id: "returns", label: "Sales Return", icon: "↩" },
    { id: "exchange", label: "Exchange", icon: "🔄" },
    { id: "creditNotes", label: "Credit Notes", icon: "📝" },
    { id: "ledger", label: "Ledger", icon: "≡" },
    { id: "payments", label: "Payments", icon: "◎" },
    { id: "outstandingTransfer", label: "Outstanding Transfer", icon: "⇄" },
    { id: "adjustments", label: "Adjustments", icon: "±" },
    { id: "commission", label: "Commission", icon: "🎯" },
    { id: "bookings", label: "Advance Booking", icon: "▦" },
    { id: "orders", label: "Daily Orders", icon: "☎" },
    { id: "promises", label: "Promise To Pay", icon: "🤝" },
    { id: "leads", label: "Leads", icon: "◔" },
    { id: "products", label: "Products", icon: "▧" },
    { id: "drivers", label: "Drivers", icon: "🚚" },
    { id: "offers", label: "Offers", icon: "🎁" },
    { id: "reports", label: "Reports", icon: "▥" },
    { id: "assistant", label: "Sales Assistant", icon: "◈" },
    { id: "estimator", label: "Cement Estimator", icon: "▨" },
  ];
  if (role === "admin") items.push({ id: "settings", label: "Settings", icon: "⚙" });

  return (
    <div className="w-56 shrink-0 bg-slate-900 text-slate-200 flex flex-col h-full">
      <div className="px-4 py-5 border-b border-slate-700 flex items-center gap-2">
        {logoUrl && <img src={logoUrl} alt="Logo" className="w-8 h-8 object-contain shrink-0" />}
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-white font-bold">Trading Ledger</div>
          <div className="text-lg font-black uppercase tracking-tight text-white leading-tight">{companyName}</div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-3">
        {items.map((it) => (
          <button
            key={it.id}
            onClick={() => setPage(it.id)}
            className={`w-full text-left px-4 py-2.5 flex items-center gap-3 text-sm font-medium transition-colors ${
              page === it.id
                ? "bg-white text-slate-900 font-bold"
                : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            <span className="w-4 text-center">{it.icon}</span>
            {t(it.label)}
          </button>
        ))}
      </nav>
      <div className="p-3 border-t border-slate-700">
        <button
          onClick={onLogout}
          className="w-full text-xs uppercase tracking-wide font-bold text-slate-400 hover:text-white px-2 py-2"
        >
          Log out
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div className="bg-white border border-slate-200 p-4 flex-1 min-w-[150px]">
      <div className="text-[11px] uppercase tracking-wide text-slate-500 font-bold">{label}</div>
      <div className={`text-2xl font-black mt-1 ${accent || "text-slate-900"}`}>{value}</div>
    </div>
  );
}

function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className={`bg-white w-full ${wide ? "max-w-3xl" : "max-w-lg"} mt-8 mb-8 border-t-4 border-slate-900`}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
          <h3 className="font-black uppercase tracking-tight text-slate-900">{t(title)}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 text-xl leading-none">×</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block mb-3">
      <span className="block text-[11px] uppercase tracking-wide font-bold text-slate-500 mb-1">{t(label)}</span>
      {children}
    </label>
  );
}
const inputCls = "w-full border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900";

function Btn({ children, onClick, variant = "primary", type = "button", small, disabled }) {
  const base = `${small ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm"} font-bold uppercase tracking-wide transition-colors ${disabled ? "opacity-40 cursor-not-allowed" : ""}`;
  const styles = {
    primary: "bg-slate-900 text-white hover:bg-slate-700",
    dark: "bg-slate-900 text-white hover:bg-slate-700",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100 border border-slate-300",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };
  return (
    <button type={type} onClick={disabled ? undefined : onClick} disabled={disabled} className={`${base} ${styles[variant]}`}>
      {typeof children === "string" ? t(children) : children}
    </button>
  );
}

/* ---------------- Login ---------------- */

function Login({ users, customers, onLogin, companyName, logoUrl, onResetUsers }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [resetMsg, setResetMsg] = useState("");
  const [failCount, setFailCount] = useState(0);

  function submit() {
    const uname = username.trim().toLowerCase();
    const pass = password;
    const staffMatch = users.find((x) => x.username.toLowerCase() === uname && x.password === pass);
    if (staffMatch) { setError(""); onLogin(staffMatch); return; }
    const custMatch = customers.find((c) => c.portalUsername && c.portalUsername.toLowerCase() === uname && c.portalPassword === pass);
    if (custMatch) { setError(""); onLogin({ id: custMatch.id, name: custMatch.name, role: "customer", username: custMatch.portalUsername }); return; }
    setError("Galat username ya password.");
    setFailCount((n) => n + 1);
  }

  function resetDefaults() {
    onResetUsers();
    setResetMsg("Default logins wapas set ho gaye: admin/admin123, staff/staff123. Ab dobara try karein.");
    setFailCount(0);
  }

  function onKeyDown(e) {
    if (e.key === "Enter") submit();
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm border-t-4 border-slate-900">
        <div className="px-6 pt-4 flex justify-end">
          <LanguageSwitcher />
        </div>
        <div className="px-6 pt-2 pb-2">
          {logoUrl && <img src={logoUrl} alt="Logo" className="w-12 h-12 object-contain mb-2" />}
          <div className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-bold">Trading Ledger</div>
          <div className="text-2xl font-black uppercase tracking-tight text-slate-900">{companyName}</div>
        </div>
        <div className="p-6 pt-4">
          <Field label="Username">
            <input className={inputCls} value={username} onChange={(e) => setUsername(e.target.value)} onKeyDown={onKeyDown} autoFocus />
          </Field>
          <Field label="Password">
            <input type="password" className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={onKeyDown} />
          </Field>
          {error && <div className="text-red-600 text-sm font-semibold mb-3">{error}</div>}
          <Btn onClick={submit}>Log In</Btn>
          {failCount >= 1 && (
            <div className="mt-3 pt-3 border-t border-slate-200">
              <button type="button" onClick={resetDefaults} className="text-xs font-bold text-blue-700 hover:underline">
                Login nahi ho raha? Default logins reset karein
              </button>
              {resetMsg && <div className="text-emerald-600 text-xs font-semibold mt-2">{resetMsg}</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Ledger computation ---------------- */

function isInvoiceCancelled(inv) {
  return inv.docStatus === "Cancelled";
}

// A payment is "linked" to an invoice either via the explicit invoiceId
// field (new invoices) or via the legacy `Against <number>` note text
// (invoices created before this field existed). Used so that cancelling
// an invoice also reverses the payment that was recorded against it.
function isPaymentLinkedToCancelledInvoice(payment, invoices) {
  if (payment.invoiceId) {
    const inv = invoices.find((i) => i.id === payment.invoiceId);
    return !!inv && isInvoiceCancelled(inv);
  }
  if (payment.note && payment.note.startsWith("Against ")) {
    const num = payment.note.replace("Against ", "").trim();
    const inv = invoices.find((i) => i.number === num);
    return !!inv && isInvoiceCancelled(inv);
  }
  return false;
}

// Phase 2: computeLedgerForCustomer optionally takes `returns` and
// `exchanges` arrays. Both params default to [] so every existing call
// site (that doesn't know about them yet) keeps working exactly as before.
// Phase 3: also optionally takes `promises` ([] default, same backward-
// compatible pattern) to add "Promise Created" / "Payment Against Promise"
// ledger lines (Feature 6). Promise-created lines are informational only
// (0 debit / 0 credit) so they never change the running balance; only the
// actual payment (already logged as a Payment entry) affects the balance.
// Outstanding Transfer feature: also optionally takes `transfers` ([]
// default, same backward-compatible pattern). Only "Active" transfers
// affect the balance — a "Reversed" transfer is excluded entirely, which
// automatically restores both customers' balances to what they were
// before the transfer (same pattern as Deleted returns/exchanges above).
// This is NOT a payment and never touches the payments table.
//
// Adjustment feature: also optionally takes `adjustments` ([] default,
// same backward-compatible pattern). Only "Active" adjustments affect the
// balance — a "Reversed" adjustment is excluded entirely, which
// automatically restores the balance to what it was before the
// adjustment (same pattern as transfers/returns/exchanges above). This is
// NOT a payment or invoice and never touches those tables. Editing an
// active adjustment updates its own amount/type in place — since the
// ledger balance is recomputed fresh from every active adjustment's
// current fields on every render (never stored incrementally), this
// naturally "reverses the old amount and applies the new one" without
// needing a separate reversal record, while editHistory keeps the audit
// trail of what changed.
//
// BUGFIX (partial qty): Sales Return / Exchange ledger lines now also carry
// the returned / new quantity (in the invoice line's own unit — Feet,
// Meter, KG, Liter, Sq.Ft, etc.) so the Ledger view can show "what quantity
// moved", not just the money amount. Quantities are rounded with roundQty
// to avoid floating point drift (e.g. 5.999999999 instead of 6).
function computeLedgerForCustomer(customer, invoices, payments, returns = [], exchanges = [], promises = [], transfers = [], adjustments = []) {
  const entries = [];
  invoices
    .filter((i) => i.customerId === customer.id && !isInvoiceCancelled(i))
    .forEach((inv) =>
      entries.push({
        date: inv.date, type: "Invoice", ref: inv.number, debit: inv.total, credit: 0, id: inv.id,
        qty: roundQty((inv.items || []).reduce((s, it) => s + (Number(it.qty) || 0), 0)),
      })
    );
  payments
    .filter((p) => p.customerId === customer.id && !isPaymentLinkedToCancelledInvoice(p, invoices))
    .forEach((p) =>
      entries.push({ date: p.date, type: p.promiseId ? "Payment Against Promise" : "Payment", ref: p.promiseId ? (promises.find((pr) => pr.id === p.promiseId)?.code || p.method || "Cash") : (p.method || "Cash"), debit: 0, credit: p.amount, id: p.id })
    );
  returns
    .filter((r) => r.customerId === customer.id && r.status !== "Deleted")
    .forEach((r) =>
      entries.push({
        date: r.date, type: "Sales Return", ref: r.code, debit: 0, credit: r.amount, id: r.id,
        qty: roundQty((r.items || []).reduce((s, it) => s + (Number(it.qtyReturned) || 0), 0)),
        invoiceNumber: r.invoiceNumber,
      })
    );
  exchanges
    .filter((ex) => ex.customerId === customer.id && ex.status !== "Deleted")
    .forEach((ex) => {
      const returnedQty = roundQty((ex.returnedItems || []).reduce((s, it) => s + (Number(it.qty) || 0), 0));
      const newQty = roundQty((ex.newItems || []).reduce((s, it) => s + (Number(it.qty) || 0), 0));
      if (ex.difference > 0) {
        entries.push({ date: ex.date, type: "Exchange (Extra Charge)", ref: ex.code, debit: ex.difference, credit: 0, id: ex.id, returnedQty, newQty, invoiceNumber: ex.invoiceNumber });
      } else if (ex.difference < 0) {
        entries.push({ date: ex.date, type: "Exchange (Refund Credit)", ref: ex.code, debit: 0, credit: Math.abs(ex.difference), id: ex.id, returnedQty, newQty, invoiceNumber: ex.invoiceNumber });
      } else {
        entries.push({ date: ex.date, type: "Exchange (Even Swap)", ref: ex.code, debit: 0, credit: 0, id: ex.id, returnedQty, newQty, invoiceNumber: ex.invoiceNumber });
      }
    });
  promises
    .filter((p) => p.customerId === customer.id && p.status !== "Deleted")
    .forEach((p) =>
      entries.push({ date: p.promiseDate, type: `Promise Created (${p.status})`, ref: p.code, debit: 0, credit: 0, id: p.id })
    );
  transfers
    .filter((t) => t.status === "Active" && (t.fromCustomerId === customer.id || t.toCustomerId === customer.id))
    .forEach((t) => {
      if (t.fromCustomerId === customer.id) {
        entries.push({
          date: t.date, type: "Outstanding Transfer Out", ref: t.code, debit: 0, credit: t.amount,
          id: t.id + "_out", counterparty: t.toCustomerName, note: t.reason,
        });
      } else {
        entries.push({
          date: t.date, type: "Outstanding Transfer In", ref: t.code, debit: t.amount, credit: 0,
          id: t.id + "_in", counterparty: t.fromCustomerName, note: t.reason,
        });
      }
    });
  adjustments
    .filter((a) => a.customerId === customer.id && a.status === "Active")
    .forEach((a) =>
      entries.push({
        date: a.date, type: `Adjustment — ${a.category}`, ref: a.code,
        debit: a.type === "Add" ? a.amount : 0, credit: a.type === "Reduce" ? a.amount : 0,
        id: a.id, note: a.reason, adjNote: a.note,
      })
    );
  entries.sort((a, b) => new Date(a.date) - new Date(b.date));
  let bal = Number(customer.openingBalance) || 0;
  const withBalance = entries.map((e) => {
    bal = roundMoney(bal + e.debit - e.credit);
    return { ...e, balance: bal };
  });
  return { entries: withBalance, outstanding: bal };
}

/* ---------------- Invoice Return/Exchange status helpers (Phase 2 upgrade) ---------------- */

// Returns the list of active (non-deleted) Sales Returns for an invoice.
function returnsForInvoice(invoiceId, returns) {
  return returns.filter((r) => r.invoiceId === invoiceId && r.status !== "Deleted");
}
// Returns the list of active (non-deleted) Exchanges for an invoice.
function exchangesForInvoice(invoiceId, exchanges) {
  return exchanges.filter((ex) => ex.invoiceId === invoiceId && ex.status !== "Deleted");
}

// Per line-item remaining quantity = original qty - qty returned (via Sales
// Return) - qty returned-as-part-of-exchange (via Exchange's returnedItems).
// Matching is done by itemIndex (stamped onto return/exchange line items
// when they are created) so it stays correct even if two items share a name.
//
// BUGFIX (partial qty / partial length): products sold by Feet, Meter, KG,
// Liter or Sq.Ft can be returned/exchanged in fractional amounts (e.g. a
// customer returns 6 feet out of 39 feet sold across 3 pipes). The rate
// used for every partial calculation is always
//     Original Line Amount ÷ Original Sold Quantity  (= it.price, since
//     it.total was originally computed as it.qty * it.price on the invoice)
// — never re-derived from a piece count. All qty math below is rounded via
// roundQty to eliminate floating point drift (e.g. 32.999999999996 → 33).
function computeInvoiceItemBreakdown(invoice, returns, exchanges) {
  const activeReturns = returnsForInvoice(invoice.id, returns);
  const activeExchanges = exchangesForInvoice(invoice.id, exchanges);
  return invoice.items.map((it, idx) => {
    const returnedQty = roundQty(activeReturns.reduce((sum, r) => {
      const line = (r.items || []).find((x) => x.itemIndex === idx);
      return sum + (line ? Number(line.qtyReturned) || 0 : 0);
    }, 0));
    const exchangedQty = roundQty(activeExchanges.reduce((sum, ex) => {
      const line = (ex.returnedItems || []).find((x) => x.itemIndex === idx);
      return sum + (line ? Number(line.qty) || 0 : 0);
    }, 0));
    // Per-unit rate — always Original Line Amount ÷ Original Sold Quantity.
    // it.price already equals that (total was qty*price at invoice time),
    // but we recompute defensively from it.total/it.qty when available so
    // this keeps working even for older records where price may be stale.
    const perUnitRate = Number(it.qty) > 0 ? roundMoney(Number(it.total ?? it.qty * it.price) / Number(it.qty)) : Number(it.price) || 0;
    const remainingQty = roundQty(Math.max(0, Number(it.qty) - returnedQty - exchangedQty));
    return { ...it, itemIndex: idx, returnedQty, exchangedQty, remainingQty, perUnitRate };
  });
}

// Computes the overall invoice status per Feature 4 / Feature 5:
// Normal, Partially Returned, Fully Returned, Partially Exchanged,
// Fully Exchanged, Returned + Exchanged.
function computeInvoiceReturnStatus(invoice, returns, exchanges) {
  const breakdown = computeInvoiceItemBreakdown(invoice, returns, exchanges);
  const totalOriginal = roundQty(breakdown.reduce((s, it) => s + Number(it.qty), 0));
  const totalReturned = roundQty(breakdown.reduce((s, it) => s + it.returnedQty, 0));
  const totalExchanged = roundQty(breakdown.reduce((s, it) => s + it.exchangedQty, 0));
  const totalRemaining = roundQty(breakdown.reduce((s, it) => s + it.remainingQty, 0));
  const hasReturn = totalReturned > 0;
  const hasExchange = totalExchanged > 0;
  const isFullyConsumed = totalRemaining <= 0 && totalOriginal > 0;

  let status = "Normal";
  if (hasReturn && hasExchange) {
    status = "Returned + Exchanged";
  } else if (hasExchange) {
    status = isFullyConsumed ? "Fully Exchanged" : "Partially Exchanged";
  } else if (hasReturn) {
    status = isFullyConsumed ? "Fully Returned" : "Partially Returned";
  }

  return {
    breakdown, totalOriginal, totalReturned, totalExchanged, totalRemaining,
    isFullyConsumed, isLocked: isFullyConsumed, status,
  };
}

const RETURN_STATUS_TONE = {
  "Normal": "bg-slate-100 text-slate-500",
  "Partially Returned": "bg-blue-100 text-blue-700",
  "Fully Returned": "bg-red-100 text-red-700",
  "Partially Exchanged": "bg-blue-100 text-blue-700",
  "Fully Exchanged": "bg-amber-100 text-amber-700",
  "Returned + Exchanged": "bg-purple-100 text-purple-700",
};

/* ---------------- Promise To Pay helpers (Phase 3) ---------------- */

const PROMISE_STATUS_TONE = {
  "Pending": "bg-blue-100 text-blue-700",
  "Partially Paid": "bg-amber-100 text-amber-700",
  "Completed": "bg-emerald-100 text-emerald-700",
  "Broken Promise": "bg-red-100 text-red-700",
  "Cancelled": "bg-slate-200 text-slate-600",
};

// Feature 11 — Auto Status. Given a raw promise record, derives the
// effective status: if manually Completed/Cancelled that's kept as-is;
// otherwise Pending/Partially Paid flips to "Broken Promise" once the
// Expected Payment Date has passed and money is still owed.
function computePromiseStatus(promise) {
  if (promise.status === "Completed" || promise.status === "Cancelled" || promise.status === "Deleted") {
    return promise.status;
  }
  const paid = Number(promise.paidAmount) || 0;
  const amount = Number(promise.amount) || 0;
  const remaining = Math.max(0, amount - paid);
  if (remaining <= 0) return "Completed";
  const isOverdue = promise.expectedDate && todayISO() > promise.expectedDate;
  if (isOverdue) return "Broken Promise";
  return paid > 0 ? "Partially Paid" : "Pending";
}

function promiseWithComputed(promise) {
  const paid = Number(promise.paidAmount) || 0;
  const amount = Number(promise.amount) || 0;
  const remaining = Math.max(0, amount - paid);
  return { ...promise, paidAmount: paid, remainingAmount: remaining, status: computePromiseStatus(promise) };
}

/* ---------------- Outstanding Transfer helpers ---------------- */

const TRANSFER_STATUS_TONE = {
  Active: "bg-emerald-100 text-emerald-700",
  Reversed: "bg-slate-200 text-slate-600",
};

/* ---------------- Adjustment helpers ---------------- */

const ADJUSTMENT_CATEGORIES = [
  "Service / Kaam", "Transport", "Loading", "Unloading", "Labour", "Repair",
  "Extra Charges", "Discount", "Compensation", "Balance Correction", "Other",
];

const ADJUSTMENT_STATUS_TONE = {
  Active: "bg-emerald-100 text-emerald-700",
  Reversed: "bg-slate-200 text-slate-600",
};

/* ---------------- Commission Management helpers ---------------- */
// Integrates with the existing Invoice/Customer/Payment systems without
// altering any of them: commission is tracked as its own set of entities
// (commissionAgents / commissionRules / commissionTransactions /
// commissionPayments) that only ever READ invoice data. Commission is
// never added to invoice.total, never changes customer ledgers, and
// never touches the payments table used for customer payments.

const COMMISSION_TYPES = ["percentage", "fixed", "per_bag", "per_item"];
const COMMISSION_TYPE_LABELS = {
  percentage: "Percentage",
  fixed: "Fixed Amount",
  per_bag: "Per Bag",
  per_item: "Per Item",
};
const COMMISSION_STATUSES = ["Pending", "Approved", "Paid", "Cancelled"];
const COMMISSION_STATUS_TONE = {
  Pending: "bg-blue-100 text-blue-700",
  Approved: "bg-amber-100 text-amber-700",
  Paid: "bg-emerald-100 text-emerald-700",
  Cancelled: "bg-slate-200 text-slate-600",
};
const COMMISSION_PAYMENT_METHODS = ["Cash", "Bank", "Online Transfer", "Other"];
const ALL_PRODUCTS_KEY = "All Products";

// Formats a commission rate for display, e.g. "2%" or "Rs 20 / Bag".
function fmtCommissionRate(type, rate) {
  const r = Number(rate) || 0;
  if (type === "percentage") return `${r}%`;
  if (type === "per_bag") return `${fmtMoney(r)} / Bag`;
  if (type === "per_item") return `${fmtMoney(r)} / Item`;
  return `${fmtMoney(r)} / Invoice`;
}

// Picks the single best-matching Active rule for one invoice line item,
// per the priority ladder:
//   1. Agent + specific Product (rule.productMatch === item.name)
//   2. Agent + All Products      (rule.productMatch === "All Products")
//   3. Agent's own default commissionType/commissionRate (from the Agent
//      record itself) — used only when no Rule at all matches this agent.
// Rules are further filtered to Active status and to the invoice date
// falling inside [startDate, endDate] when those are set.
function findMatchingRule(rules, agentId, productName, invoiceDate) {
  const active = (rules || []).filter((r) => {
    if (r.agentId !== agentId) return false;
    if (r.status !== "Active") return false;
    if (r.startDate && invoiceDate < r.startDate) return false;
    if (r.endDate && invoiceDate > r.endDate) return false;
    return true;
  });
  const specific = active.find((r) => r.productMatch === productName);
  if (specific) return specific;
  const allProducts = active.find((r) => r.productMatch === ALL_PRODUCTS_KEY);
  if (allProducts) return allProducts;
  return null;
}

// Computes commission for one invoice, given the agent and the current
// (possibly return/exchange-adjusted) item breakdown. Returns both the
// total and a per-source breakdown so the Commission Ledger / invoice
// preview can show exactly how the number was built.
//
// - percentage / fixed rules are applied ONCE per matching rule-group
//   (not once per line item), matching "2% of the sale" / "Rs 1,000 per
//   invoice" semantics rather than accidentally multiplying by line count.
// - per_bag / per_item rules are applied per matched quantity (rate × qty),
//   which is what makes "recalculates automatically" (Feature 16) work:
//   call this again with the post-return breakdown and it naturally
//   produces the lower quantity's commission.
// - minSaleAmount / maxCommission are enforced per rule-group.
// - Falls back to the agent's own default commissionType/commissionRate
//   (spread across the WHOLE invoice, like an implicit "All Products"
//   rule) when no Rule matches this agent at all.
function computeCommissionForInvoice(agent, rules, items, invoiceDate, subtotal) {
  if (!agent) return { total: 0, lines: [] };
  const cleanItems = (items || []).filter((it) => Number(it.qty) > 0);
  const groups = {}; // ruleId (or "__default__") -> { rule, items: [] }

  cleanItems.forEach((it) => {
    const rule = findMatchingRule(rules, agent.id, it.name, invoiceDate);
    const key = rule ? rule.id : "__default__";
    if (!groups[key]) groups[key] = { rule, items: [] };
    groups[key].items.push(it);
  });

  // Nothing matched any explicit Rule at all -> whole invoice falls back
  // to the agent's own default commission type/rate (tier 4).
  const matchedAnyRule = Object.values(groups).some((g) => g.rule);
  if (!matchedAnyRule && agent.defaultCommissionType && Number(agent.defaultCommissionRate) > 0) {
    groups.__default__ = { rule: null, items: cleanItems };
  }

  const lines = [];
  Object.entries(groups).forEach(([key, group]) => {
    const rule = group.rule;
    const type = rule ? rule.commissionType : agent.defaultCommissionType;
    const rate = Number(rule ? rule.commissionRate : agent.defaultCommissionRate) || 0;
    if (!type || rate <= 0) return;
    const matchedQty = roundQty(group.items.reduce((s, it) => s + Number(it.qty), 0));
    const matchedAmount = roundMoney(group.items.reduce((s, it) => s + Number(it.total ?? it.qty * it.price), 0));
    const minSale = rule && Number(rule.minSaleAmount) > 0 ? Number(rule.minSaleAmount) : 0;
    const basisAmount = rule && rule.productMatch === ALL_PRODUCTS_KEY ? subtotal : matchedAmount;
    if (minSale > 0 && basisAmount < minSale) return;

    let commission = 0;
    if (type === "percentage") {
      commission = roundMoney((basisAmount * rate) / 100);
    } else if (type === "fixed") {
      commission = roundMoney(rate);
    } else {
      // per_bag / per_item — rate × matched quantity
      commission = roundMoney(rate * matchedQty);
    }
    const maxCap = rule && Number(rule.maxCommission) > 0 ? Number(rule.maxCommission) : 0;
    if (maxCap > 0 && commission > maxCap) commission = maxCap;
    if (commission <= 0) return;

    lines.push({
      ruleId: rule ? rule.id : "",
      source: rule ? (rule.productMatch === ALL_PRODUCTS_KEY ? "All Products Rule" : `${rule.productMatch} Rule`) : "Agent Default",
      commissionType: type,
      commissionRate: rate,
      matchedQty,
      matchedAmount,
      commission,
    });
  });

  const total = roundMoney(lines.reduce((s, l) => s + l.commission, 0));
  return { total, lines };
}

// Recomputes a commission transaction's amount from the invoice's CURRENT
// item breakdown (i.e. after any Sales Return / Exchange has reduced
// remaining quantities), using the SAME rule the transaction was
// originally created against wherever possible, so partial returns
// correctly shrink (never silently zero out) the commission. This is
// called after createSalesReturn / deleteSalesReturn / createExchangeFn /
// deleteExchangeFn and after invoice edits that change items.
function recalculatedCommissionAmount(agent, rules, invoice, returns, exchanges) {
  const breakdown = computeInvoiceItemBreakdown(invoice, returns, exchanges);
  const remainingItems = breakdown
    .filter((it) => it.remainingQty > 0)
    .map((it) => ({ name: it.name, qty: it.remainingQty, price: it.perUnitRate, total: roundMoney(it.remainingQty * it.perUnitRate) }));
  const remainingSubtotal = roundMoney(remainingItems.reduce((s, it) => s + it.total, 0));
  return computeCommissionForInvoice(agent, rules, remainingItems, invoice.date, remainingSubtotal);
}

// Ledger-style aggregation for one Commission Agent: every commission
// transaction plus every commission payment against them, running
// balance style, mirroring the customer ledger's shape/spirit but kept
// completely separate from computeLedgerForCustomer (different entities,
// different table).
function computeCommissionSummaryForAgent(agentId, transactions, payments) {
  const myTxns = (transactions || []).filter((tx) => tx.agentId === agentId && tx.status !== "Cancelled");
  const totalCommission = roundMoney(myTxns.reduce((s, tx) => s + Number(tx.commissionAmount || 0), 0));
  const totalPaid = roundMoney(myTxns.reduce((s, tx) => s + Number(tx.paidAmount || 0), 0));
  const remaining = roundMoney(totalCommission - totalPaid);
  const pending = roundMoney((transactions || []).filter((tx) => tx.agentId === agentId && tx.status === "Pending").reduce((s, tx) => s + Number(tx.commissionAmount || 0), 0));
  const approved = roundMoney((transactions || []).filter((tx) => tx.agentId === agentId && tx.status === "Approved").reduce((s, tx) => s + Number(tx.commissionAmount || 0), 0));
  const paidStatus = roundMoney((transactions || []).filter((tx) => tx.agentId === agentId && tx.status === "Paid").reduce((s, tx) => s + Number(tx.commissionAmount || 0), 0));
  return { totalCommission, totalPaid, remaining, pending, approved, paidStatus, transactions: myTxns };
}

/* ---------------- Dashboard ---------------- */

function Dashboard({ customers, invoices, payments, returns, exchanges, promises, transfers, adjustments, leads, bookings, onOpenPromises }) {
  const outstandingTotal = useMemo(() => {
    return customers.reduce((sum, c) => sum + computeLedgerForCustomer(c, invoices, payments, returns, exchanges, promises, transfers, adjustments).outstanding, 0);
  }, [customers, invoices, payments, returns, exchanges, promises, transfers, adjustments]);

  const todaySales = useMemo(() => {
    const t = todayISO();
    return invoices.filter((i) => i.date === t && !isInvoiceCancelled(i)).reduce((s, i) => s + i.total, 0);
  }, [invoices]);

  const monthSales = useMemo(() => {
    const m = todayISO().slice(0, 7);
    return invoices.filter((i) => i.date.startsWith(m) && !isInvoiceCancelled(i)).reduce((s, i) => s + i.total, 0);
  }, [invoices]);

  const activeLeads = leads.filter((l) => l.status !== "Won" && l.status !== "Lost").length;
  const openBookings = bookings.filter((b) => b.status === "Booked" || b.status === "Partially Delivered").length;

  const recentInvoices = [...invoices].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);

  // Feature 8 — Promise dashboard cards
  const activePromises = useMemo(() => promises.filter((p) => p.status !== "Deleted").map(promiseWithComputed), [promises]);
  const t = todayISO();
  const in7 = new Date(); in7.setDate(in7.getDate() + 7);
  const in7ISO = in7.toISOString().slice(0, 10);
  const todaysPromises = activePromises.filter((p) => p.expectedDate === t && (p.status === "Pending" || p.status === "Partially Paid"));
  const upcomingPromises = activePromises.filter((p) => p.expectedDate > t && p.expectedDate <= in7ISO && (p.status === "Pending" || p.status === "Partially Paid"));
  const overduePromises = activePromises.filter((p) => p.status === "Broken Promise");
  const pendingPromises = activePromises.filter((p) => p.status === "Pending" || p.status === "Partially Paid");
  const completedPromises = activePromises.filter((p) => p.status === "Completed");
  const brokenPromises = activePromises.filter((p) => p.status === "Broken Promise");
  const totalPromisedAmount = activePromises.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const promiseCustomers = new Set(activePromises.map((p) => p.customerId)).size;

  return (
    <div>
      <h2 className="text-xl font-black uppercase tracking-tight mb-4">Dashboard</h2>

      {/* Feature 9 — Home Alert: today's promise collections */}
      {todaysPromises.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 p-4 mb-4 cursor-pointer hover:bg-amber-100" onClick={onOpenPromises}>
          <div className="text-[11px] uppercase tracking-wide font-black text-amber-700 mb-2">Today's Promise Collection</div>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
            {todaysPromises.map((p) => (
              <div key={p.id}><span className="font-bold">{p.customerName}</span> — <span className="font-black text-amber-700">{fmtMoney(p.remainingAmount)}</span></div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-6">
        <Stat label="Today's Sales" value={fmtMoney(todaySales)} />
        <Stat label="This Month" value={fmtMoney(monthSales)} />
        <Stat label="Total Outstanding" value={fmtMoney(outstandingTotal)} accent="text-red-600" />
        <Stat label="Active Leads" value={activeLeads} />
        <Stat label="Open Bookings" value={openBookings} />
        <Stat label="Customers" value={customers.length} />
      </div>

      <div className="text-xs font-black uppercase tracking-wide text-slate-500 mb-2">Promise To Pay Overview</div>
      <div className="flex flex-wrap gap-3 mb-6">
        <Stat label="Today's Promises" value={todaysPromises.length} accent="text-blue-700" />
        <Stat label="Upcoming (7 Days)" value={upcomingPromises.length} />
        <Stat label="Overdue Promises" value={overduePromises.length} accent="text-red-600" />
        <Stat label="Pending Promises" value={pendingPromises.length} />
        <Stat label="Completed Promises" value={completedPromises.length} accent="text-emerald-600" />
        <Stat label="Broken Promises" value={brokenPromises.length} accent="text-red-600" />
        <Stat label="Total Promised Amount" value={fmtMoney(totalPromisedAmount)} />
        <Stat label="Promise Customers" value={promiseCustomers} />
      </div>

      <div className="bg-white border border-slate-200">
        <div className="px-4 py-2.5 border-b border-slate-200 font-black uppercase text-xs tracking-wide text-slate-500">
          Recent Invoices
        </div>
        <table className="w-full text-sm">
          <tbody>
            {recentInvoices.length === 0 && (
              <tr><td className="px-4 py-6 text-slate-400 text-center" colSpan={4}>Koi invoice nahi bana abhi tak.</td></tr>
            )}
            {recentInvoices.map((inv) => (
              <tr key={inv.id} className="border-t border-slate-100">
                <td className="px-4 py-2 font-bold">{inv.number}</td>
                <td className="px-4 py-2">{inv.customerName}</td>
                <td className="px-4 py-2 text-slate-500">{fmtDate(inv.date)}</td>
                <td className="px-4 py-2 text-right font-bold">{fmtMoney(inv.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------- Customers ---------------- */

function CustomerForm({ initial, branches, currentUser, onSave, onCancel }) {
  const [form, setForm] = useState(
    initial || { name: "", phone: "", address: "", creditLimit: 0, openingBalance: 0, audienceType: "Builder", portalUsername: "", portalPassword: "", branchId: currentUser?.branchId || "" }
  );
  const isLocked = !!currentUser?.branchId;
  return (
    <div>
      <Field label="Customer Name">
        <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </Field>
      <Field label="Phone (with WhatsApp, e.g. 03001234567)">
        <input className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      </Field>
      <Field label="Address">
        <input className={inputCls} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
      </Field>
      {branches.length > 0 && (
        <Field label="Branch">
          {isLocked ? (
            <div className="text-sm font-bold text-slate-700 bg-slate-50 border border-slate-200 px-3 py-2">
              {branches.find((b) => b.id === currentUser.branchId)?.name || "Your Branch"}
            </div>
          ) : (
            <select className={inputCls} value={form.branchId || ""} onChange={(e) => setForm({ ...form, branchId: e.target.value })}>
              <option value="">Unassigned (visible to Super Admin only)</option>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          )}
        </Field>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Credit Limit (Rs)">
          <input type="number" className={inputCls} value={form.creditLimit}
            onChange={(e) => setForm({ ...form, creditLimit: Number(e.target.value) })} />
        </Field>
        <Field label="Opening Balance (Rs)">
          <input type="number" className={inputCls} value={form.openingBalance}
            onChange={(e) => setForm({ ...form, openingBalance: Number(e.target.value) })} />
        </Field>
      </div>
      <Field label="Audience Type (for Sales Assistant)">
        <select className={inputCls} value={form.audienceType || "Builder"} onChange={(e) => setForm({ ...form, audienceType: e.target.value })}>
          {AUDIENCE_TYPES.map((a) => <option key={a}>{a}</option>)}
        </select>
      </Field>
      <div className="border-t border-slate-200 mt-3 pt-3">
        <div className="text-[11px] uppercase tracking-wide font-bold text-slate-500 mb-2">Customer Portal Login (optional)</div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Portal Username">
            <input className={inputCls} value={form.portalUsername || ""} onChange={(e) => setForm({ ...form, portalUsername: e.target.value })} />
          </Field>
          <Field label="Portal Password">
            <input className={inputCls} value={form.portalPassword || ""} onChange={(e) => setForm({ ...form, portalPassword: e.target.value })} />
          </Field>
        </div>
      </div>
      <div className="flex gap-2 mt-2">
        <Btn onClick={() => form.name.trim() && onSave(form)}>Save Customer</Btn>
        <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
      </div>
    </div>
  );
}

function Customers({ customers, invoices, payments, returns, exchanges, promises, transfers, adjustments, saveCustomer, deleteCustomer, openLedger, branches, currentUser }) {
  const [modal, setModal] = useState(null); // null | 'new' | customer object
  const [q, setQ] = useState("");

  const rows = customers
    .filter((c) => c.name.toLowerCase().includes(q.toLowerCase()) || (c.phone || "").includes(q))
    .map((c) => {
      const { outstanding } = computeLedgerForCustomer(c, invoices, payments, returns, exchanges, promises, transfers, adjustments);
      return { ...c, outstanding };
    });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-black uppercase tracking-tight">Customers</h2>
        <Btn onClick={() => setModal("new")}>+ New Customer</Btn>
      </div>
      <input
        className={`${inputCls} mb-3 max-w-xs`}
        placeholder="Search name or phone..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div className="bg-white border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-slate-200">
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Phone</th>
              <th className="px-4 py-2 text-right">Credit Limit</th>
              <th className="px-4 py-2 text-right">Outstanding</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">Koi customer nahi mila.</td></tr>
            )}
            {rows.map((c) => (
              <tr key={c.id} className="border-t border-slate-100">
                <td className="px-4 py-2 font-bold cursor-pointer hover:text-blue-700" onClick={() => openLedger(c.id)}>{c.name}</td>
                <td className="px-4 py-2 text-slate-500">{c.phone}</td>
                <td className="px-4 py-2 text-right">{fmtMoney(c.creditLimit)}</td>
                <td className={`px-4 py-2 text-right font-bold ${c.outstanding > (c.creditLimit || Infinity) ? "text-red-600" : ""}`}>
                  {fmtMoney(c.outstanding)}
                  {c.creditLimit > 0 && c.outstanding > c.creditLimit && (
                    <div className="text-[10px] font-bold text-red-600 uppercase">Over limit</div>
                  )}
                </td>
                <td className="px-4 py-2 text-right whitespace-nowrap">
                  <button className="text-xs font-bold text-slate-500 hover:text-blue-700 mr-3" onClick={() => setModal(c)}>Edit</button>
                  <button className="text-xs font-bold text-slate-500 hover:text-red-600" onClick={() => { if (confirm(`Delete ${c.name}?`)) deleteCustomer(c.id); }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal && (
        <Modal title={modal === "new" ? "New Customer" : "Edit Customer"} onClose={() => setModal(null)}>
          <CustomerForm
            initial={modal === "new" ? null : modal}
            branches={branches}
            currentUser={currentUser}
            onCancel={() => setModal(null)}
            onSave={(data) => { saveCustomer(modal === "new" ? { ...data, id: uid("c") } : data); setModal(null); }}
          />
        </Modal>
      )}
    </div>
  );
}

/* ---------------- Ledger view ---------------- */

function LedgerView({ customers, invoices, payments, returns, exchanges, promises, transfers, adjustments, focusId, setFocusId, settings, currentUser, onCreateAdjustment, onUpdateAdjustment, onReverseAdjustment }) {
  const customer = customers.find((c) => c.id === focusId) || customers[0];
  const [showAdjForm, setShowAdjForm] = useState(false);
  const [editingAdj, setEditingAdj] = useState(null);
  const [reversingAdj, setReversingAdj] = useState(null);
  const [adjReverseReason, setAdjReverseReason] = useState("");
  const canManageAdj = currentUser?.role === "admin";

  if (!customer) return <div className="text-slate-400">Pehle koi customer add karein.</div>;
  const { entries, outstanding } = computeLedgerForCustomer(customer, invoices, payments, returns, exchanges, promises, transfers, adjustments);
  const myPromises = (promises || []).filter((p) => p.customerId === customer.id && p.status !== "Deleted").map(promiseWithComputed);
  const myAdjustments = (adjustments || []).filter((a) => a.customerId === customer.id).sort((a, b) => new Date(b.date) - new Date(a.date));

  function downloadPDF() {
    window.print();
  }

  function confirmReverseAdj() {
    if (!adjReverseReason.trim()) { alert("Reverse ki wajah likhein."); return; }
    onReverseAdjustment(reversingAdj, adjReverseReason.trim());
    setReversingAdj(null); setAdjReverseReason("");
  }

  // BUGFIX: quantity moved (Invoice / Sales Return / Exchange) is now shown
  // alongside the money columns so staff can see how many units (feet,
  // meter, kg, liter, bags, etc.) each ledger line represents.
  function qtyCell(e) {
    if (e.type === "Invoice") return e.qty ? fmtQty(e.qty) : "-";
    if (e.type === "Sales Return") return e.qty ? `-${fmtQty(e.qty)}` : "-";
    if (e.type && e.type.startsWith("Exchange")) {
      return `Ret ${fmtQty(e.returnedQty || 0)} / New ${fmtQty(e.newQty || 0)}`;
    }
    return "-";
  }

  return (
    <div>
      <h2 className="text-xl font-black uppercase tracking-tight mb-4">Ledger</h2>
      <div className="flex gap-3 items-center mb-4 flex-wrap">
        <select className={`${inputCls} max-w-xs`} value={customer.id} onChange={(e) => setFocusId(e.target.value)}>
          {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div className="text-sm">
          Outstanding: <span className={`font-black ${outstanding > 0 ? "text-red-600" : "text-emerald-600"}`}>{fmtMoney(outstanding)}</span>
        </div>
        <Btn variant="dark" onClick={downloadPDF}>Download PDF</Btn>
        <Btn onClick={() => { setEditingAdj(null); setShowAdjForm(true); }}>+ Adjustment</Btn>
      </div>
      <div className="bg-white border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-slate-200">
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Ref</th>
              <th className="px-4 py-2 text-right">Qty</th>
              <th className="px-4 py-2 text-right">Debit</th>
              <th className="px-4 py-2 text-right">Credit</th>
              <th className="px-4 py-2 text-right">Balance</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-slate-100 bg-slate-50">
              <td className="px-4 py-2 text-slate-500" colSpan={6}>Opening Balance</td>
              <td className="px-4 py-2 text-right font-bold">{fmtMoney(customer.openingBalance || 0)}</td>
            </tr>
            {entries.map((e) => (
              <tr key={e.id} className="border-t border-slate-100">
                <td className="px-4 py-2">{fmtDate(e.date)}</td>
                <td className="px-4 py-2">
                  {e.type}{e.invoiceNumber ? <span className="text-slate-400"> ({e.invoiceNumber})</span> : ""}
                  {e.counterparty ? <span className="text-slate-400"> — {e.counterparty}</span> : ""}
                </td>
                <td className="px-4 py-2 text-slate-500">{e.ref}</td>
                <td className="px-4 py-2 text-right text-slate-500 text-xs">{qtyCell(e)}</td>
                <td className="px-4 py-2 text-right text-red-600">{e.debit ? fmtMoney(e.debit) : ""}</td>
                <td className="px-4 py-2 text-right text-emerald-600">{e.credit ? fmtMoney(e.credit) : ""}</td>
                <td className="px-4 py-2 text-right font-bold">{fmtMoney(e.balance)}</td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-400">Koi entry nahi.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Feature 5 — Customer Profile: Promise History */}
      <div className="mt-6 bg-white border border-slate-200 overflow-x-auto print:hidden">
        <div className="px-4 py-2.5 border-b border-slate-200 font-black uppercase text-xs tracking-wide text-slate-500">Promise History</div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-slate-200">
              <th className="px-4 py-2">Promise No</th><th className="px-4 py-2 text-right">Amount</th>
              <th className="px-4 py-2">Promise Date</th><th className="px-4 py-2">Expected Date</th>
              <th className="px-4 py-2">Status</th><th className="px-4 py-2 text-right">Paid</th><th className="px-4 py-2 text-right">Remaining</th>
            </tr>
          </thead>
          <tbody>
            {myPromises.length === 0 && <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-400">Koi promise nahi.</td></tr>}
            {myPromises.map((p) => (
              <tr key={p.id} className="border-t border-slate-100">
                <td className="px-4 py-2 font-black text-blue-700">{p.code}</td>
                <td className="px-4 py-2 text-right font-bold">{fmtMoney(p.amount)}</td>
                <td className="px-4 py-2 text-slate-500">{fmtDate(p.promiseDate)}</td>
                <td className="px-4 py-2 text-slate-500">{fmtDate(p.expectedDate)}</td>
                <td className="px-4 py-2"><span className={`text-[10px] font-bold uppercase px-2 py-0.5 ${PROMISE_STATUS_TONE[p.status]}`}>{p.status}</span></td>
                <td className="px-4 py-2 text-right text-emerald-600 font-bold">{fmtMoney(p.paidAmount)}</td>
                <td className="px-4 py-2 text-right text-red-600 font-bold">{fmtMoney(p.remainingAmount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Adjustment History for this customer */}
      <div className="mt-6 bg-white border border-slate-200 overflow-x-auto print:hidden">
        <div className="px-4 py-2.5 border-b border-slate-200 font-black uppercase text-xs tracking-wide text-slate-500">Adjustment History</div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-slate-200">
              <th className="px-4 py-2">Adj #</th><th className="px-4 py-2">Date</th><th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Category</th><th className="px-4 py-2 text-right">Amount</th>
              <th className="px-4 py-2">Reason</th><th className="px-4 py-2">Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            {myAdjustments.length === 0 && <tr><td colSpan={8} className="px-4 py-6 text-center text-slate-400">Koi adjustment nahi.</td></tr>}
            {myAdjustments.map((a) => (
              <tr key={a.id} className={`border-t border-slate-100 ${a.status === "Reversed" ? "opacity-50" : ""}`}>
                <td className="px-4 py-2 font-black text-blue-700">{a.code}</td>
                <td className="px-4 py-2 text-slate-500">{fmtDate(a.date)}</td>
                <td className="px-4 py-2">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 ${a.type === "Add" ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
                    {a.type === "Add" ? "Add (+)" : "Reduce (-)"}
                  </span>
                </td>
                <td className="px-4 py-2 text-slate-500">{a.category}</td>
                <td className={`px-4 py-2 text-right font-bold ${a.type === "Add" ? "text-red-600" : "text-emerald-600"}`}>{a.type === "Add" ? "+" : "-"}{fmtMoney(a.amount)}</td>
                <td className="px-4 py-2 text-slate-500 text-xs">{a.reason}</td>
                <td className="px-4 py-2"><span className={`text-[10px] font-bold uppercase px-2 py-0.5 ${ADJUSTMENT_STATUS_TONE[a.status] || "bg-slate-100 text-slate-500"}`}>{a.status}</span></td>
                <td className="px-4 py-2 text-right whitespace-nowrap space-x-2">
                  {a.status !== "Reversed" && canManageAdj && (
                    <>
                      <button className="text-xs font-bold text-slate-500 hover:text-blue-700" onClick={() => { setEditingAdj(a); setShowAdjForm(true); }}>Edit</button>
                      <button className="text-xs font-bold text-slate-500 hover:text-red-600" onClick={() => setReversingAdj(a)}>Reverse</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAdjForm && (
        <Modal title={editingAdj ? `Edit Adjustment ${editingAdj.code}` : "New Adjustment"} onClose={() => { setShowAdjForm(false); setEditingAdj(null); }}>
          <AdjustmentForm
            customers={customers}
            defaultCustomerId={customer.id}
            invoices={invoices}
            payments={payments}
            returns={returns}
            exchanges={exchanges}
            promises={promises}
            transfers={transfers}
            adjustments={adjustments}
            initial={editingAdj}
            currentUser={currentUser}
            onCancel={() => { setShowAdjForm(false); setEditingAdj(null); }}
            onSave={(data) => {
              if (editingAdj) onUpdateAdjustment(editingAdj, data);
              else onCreateAdjustment(data);
              setShowAdjForm(false); setEditingAdj(null);
            }}
          />
        </Modal>
      )}

      {reversingAdj && (
        <Modal title={`Reverse Adjustment ${reversingAdj.code}`} onClose={() => setReversingAdj(null)}>
          <div className="text-sm text-slate-600 mb-3">
            Ye adjustment reverse karne se <span className="font-bold">{reversingAdj.customerName}</span> ka balance is adjustment se pehle wali state mein wapis chala jayega.
          </div>
          <Field label="Reverse Reason">
            <input className={inputCls} value={adjReverseReason} onChange={(e) => setAdjReverseReason(e.target.value)} autoFocus />
          </Field>
          <div className="flex gap-2">
            <Btn variant="danger" onClick={confirmReverseAdj}>Confirm Reverse</Btn>
            <Btn variant="ghost" onClick={() => setReversingAdj(null)}>Cancel</Btn>
          </div>
        </Modal>
      )}

      {/* Hidden printable ledger — only rendered visible during print/PDF export */}
      <div id="print-ledger" style={{ display: "none" }}>
        <div className="bg-white">
          <div className="flex justify-between items-start pb-4 border-b-4 border-slate-900 mb-4">
            <div className="flex items-center gap-3">
              {settings?.logoUrl ? (
                <img src={settings.logoUrl} alt="Logo" className="w-14 h-14 object-contain" />
              ) : (
                <div className="w-14 h-14 bg-slate-900 flex items-center justify-center font-black text-xl text-white">CT</div>
              )}
              <div>
                <div className="text-xl font-black uppercase tracking-tight text-slate-900">{settings?.companyName}</div>
                <div className="text-[11px] uppercase tracking-wide font-bold text-blue-700">Construction Materials Supplier</div>
              </div>
            </div>
            <div className="text-right text-xs text-slate-500">
              <div>{settings?.companyAddress}</div>
              {settings?.companyPhone && <div>Ph: {settings.companyPhone}</div>}
            </div>
          </div>

          <div className="flex justify-between items-start mb-4">
            <div className="text-sm">
              <div className="text-[11px] uppercase tracking-wide font-bold text-slate-400 mb-0.5">Customer Ledger</div>
              <div className="font-bold text-slate-900">{customer.name}</div>
              {customer.phone && <div className="text-slate-500">{customer.phone}</div>}
              {customer.address && <div className="text-slate-500">{customer.address}</div>}
            </div>
            <div className="text-right text-xs text-slate-500">
              <div>Date: <span className="font-bold text-slate-700">{fmtDate(todayISO())}</span></div>
            </div>
          </div>

          <table className="w-full text-sm mb-4">
            <thead>
              <tr className="bg-slate-900 text-white text-[11px] uppercase tracking-wide">
                <th className="py-2 px-2 text-left">Date</th>
                <th className="py-2 px-2 text-left">Type</th>
                <th className="py-2 px-2 text-left">Ref</th>
                <th className="py-2 px-2 text-right">Debit</th>
                <th className="py-2 px-2 text-right">Credit</th>
                <th className="py-2 px-2 text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-100 bg-slate-50">
                <td className="py-2 px-2 text-slate-500" colSpan={5}>Opening Balance</td>
                <td className="py-2 px-2 text-right font-bold">{fmtMoney(customer.openingBalance || 0)}</td>
              </tr>
              {entries.map((e) => (
                <tr key={e.id} className="border-b border-slate-100">
                  <td className="py-2 px-2">{fmtDate(e.date)}</td>
                  <td className="py-2 px-2">{e.type}</td>
                  <td className="py-2 px-2 text-slate-500">{e.ref}</td>
                  <td className="py-2 px-2 text-right text-red-600">{e.debit ? fmtMoney(e.debit) : ""}</td>
                  <td className="py-2 px-2 text-right text-emerald-600">{e.credit ? fmtMoney(e.credit) : ""}</td>
                  <td className="py-2 px-2 text-right font-bold">{fmtMoney(e.balance)}</td>
                </tr>
              ))}
              {entries.length === 0 && (
                <tr><td colSpan={6} className="py-4 px-2 text-center text-slate-400">Koi entry nahi.</td></tr>
              )}
            </tbody>
          </table>

          <div className="flex justify-end">
            <div className="w-72 text-sm space-y-1.5">
              <div className="flex justify-between border-t-2 border-slate-900 pt-2 mt-1">
                <span className="font-black uppercase text-blue-700">Total Outstanding</span>
                <span className="font-black text-lg text-blue-700">{fmtMoney(outstanding)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Invoices ---------------- */

function InvoiceForm({ customers, products, drivers, bookings, invoices, payments, returns, exchanges, promises, transfers, adjustments, commissionAgents, commissionRules, prefill, editingInvoice, currentUser, onSave, onCancel, nextNumber }) {
  const isEdit = !!editingInvoice;
  // Cash Customer / Walk-In: customerType is "Regular" (existing workflow,
  // unchanged) or "Cash" (no customer account required). The type is fixed
  // once an invoice is created, so the toggle is only shown for new invoices.
  const [customerType, setCustomerType] = useState(editingInvoice?.customerType || "Regular");
  const canChangeCustomerType = !isEdit;
  const [customerId, setCustomerId] = useState(editingInvoice?.customerId || prefill?.customerId || customers[0]?.id || "");
  const [cashName, setCashName] = useState(editingInvoice?.customerType === "Cash" ? (editingInvoice?.customerName || "") : "");
  const [cashPhone, setCashPhone] = useState(editingInvoice?.customerType === "Cash" ? (editingInvoice?.customerPhone || "") : "");
  const [cashAddress, setCashAddress] = useState(editingInvoice?.customerType === "Cash" ? (editingInvoice?.customerAddress || "") : "");
  const [date, setDate] = useState(editingInvoice?.date || todayISO());
  const [items, setItems] = useState(
    editingInvoice
      ? editingInvoice.items.map((it) => ({ id: uid("it"), productId: "", name: it.name, unit: it.unit || "Bag", qty: it.qty, price: it.price }))
      : prefill
      ? [{ id: uid("it"), productId: prefill.productId || "", name: prefill.productName || "", unit: prefill.unit || "Bag", qty: prefill.qty || 1, price: prefill.rate || 0 }]
      : [{ id: uid("it"), productId: "", name: "", unit: "Bag", qty: 1, price: 0 }]
  );
  const [rickshawRent, setRickshawRent] = useState(editingInvoice?.rickshawRent || 0);
  const [deliveryCharges, setDeliveryCharges] = useState(editingInvoice?.deliveryCharges || 0);
  const [discount, setDiscount] = useState(editingInvoice?.discount || 0);
  const [driverIdInput, setDriverIdInput] = useState(editingInvoice?.driverId || "");
  const [manualDriverName, setManualDriverName] = useState(editingInvoice && !editingInvoice.driverId ? editingInvoice.driverName || "" : "");
  const [paymentReceived, setPaymentReceived] = useState(editingInvoice?.paymentReceived || 0);
  const [receivedBy, setReceivedBy] = useState(editingInvoice?.receivedBy || "");
  const [issuedToName, setIssuedToName] = useState(editingInvoice?.issuedTo?.name || "");
  const [issuedToPhone, setIssuedToPhone] = useState(editingInvoice?.issuedTo?.phone || "");
  const [issuedToRelation, setIssuedToRelation] = useState(editingInvoice?.issuedTo?.relation || "");
  const [issuedToRemarks, setIssuedToRemarks] = useState(editingInvoice?.issuedTo?.remarks || "");
  // Commission integration (additive, read-only preview here): selecting an
  // agent never changes subtotal/total/paymentReceived/balanceDue — the
  // actual commission transaction is created/synced by the App layer after
  // save, exactly the way a "payment" record is auto-created today.
  const [commissionAgentId, setCommissionAgentId] = useState(editingInvoice?.commissionAgentId || "");

  const matchedDriver = drivers.find((d) => d.code.toLowerCase() === driverIdInput.trim().toLowerCase());

  const selectedCustomer = customerType === "Regular" ? customers.find((c) => c.id === customerId) : null;
  // Cash Customer / Walk-In never carries an outstanding balance — it has
  // no customer account, no opening balance, and no ledger of its own.
  const previousOutstanding = customerType === "Cash"
    ? 0
    : isEdit
    ? (editingInvoice.previousOutstanding || 0)
    : selectedCustomer
    ? computeLedgerForCustomer(selectedCustomer, invoices, payments, returns, exchanges, promises, transfers, adjustments).outstanding
    : 0;

  // Previously used "Issued To" names for this customer, so staff can
  // quickly re-select someone who has collected material before.
  const previousIssuedTo = Array.from(
    new Set(
      invoices
        .filter((inv) => inv.customerId === customerId && inv.issuedTo?.name && inv.id !== editingInvoice?.id)
        .map((inv) => inv.issuedTo.name)
    )
  );

  const subtotal = items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.price) || 0), 0);
  const total = subtotal + (Number(rickshawRent) || 0) + (Number(deliveryCharges) || 0) - (Number(discount) || 0);
  const balanceDue = total - (Number(paymentReceived) || 0);

  // Cash Customer / Walk-In: Invoice Total = Cash Received, always. Keep
  // the payment field synced to the total so the invoice is always fully
  // paid with zero outstanding, per the Cash Sale workflow.
  useEffect(() => {
    if (customerType === "Cash") {
      setPaymentReceived(total);
    }
  }, [customerType, total]);

  const selectedAgent = commissionAgentId ? (commissionAgents || []).find((a) => a.id === commissionAgentId) : null;
  const commissionPreviewItems = items
    .filter((it) => it.name && Number(it.qty) > 0)
    .map((it) => ({ name: it.name, qty: Number(it.qty) || 0, price: Number(it.price) || 0, total: (Number(it.qty) || 0) * (Number(it.price) || 0) }));
  const commissionPreview = selectedAgent
    ? computeCommissionForInvoice(selectedAgent, commissionRules, commissionPreviewItems, date, subtotal)
    : { total: 0, lines: [] };

  function updateItem(id, patch) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }
  function addItem() {
    setItems((prev) => [...prev, { id: uid("it"), productId: "", name: "", unit: "Bag", qty: 1, price: 0 }]);
  }
  function removeItem(id) {
    setItems((prev) => (prev.length > 1 ? prev.filter((it) => it.id !== id) : prev));
  }
  function pickProduct(id, productId) {
    const p = products.find((p) => p.id === productId);
    updateItem(id, { productId, name: p ? p.name : "", unit: p ? p.unit : "Bag", price: p ? p.price : 0 });
  }

  function submit() {
    let customer = null;
    if (customerType === "Regular") {
      customer = customers.find((c) => c.id === customerId);
      if (!customer) { alert("Pehle customer select karein."); return; }
    }
    const cleanItems = items.filter((it) => it.name && Number(it.qty) > 0);
    if (cleanItems.length === 0) { alert("Kam az kam ek item add karein."); return; }
    const issuedTo = issuedToName.trim()
      ? { name: issuedToName.trim(), phone: issuedToPhone.trim(), relation: issuedToRelation, remarks: issuedToRemarks.trim() }
      : null;

    // Cash Customer / Walk-In: no customer account required. Name/phone/
    // address are optional free-text fields, defaulting to "Cash Customer"
    // when no name is entered. Invoice Total = Cash Received, so the
    // invoice is always fully paid with zero outstanding balance.
    const finalCustomerId = customerType === "Cash" ? (isEdit ? editingInvoice.customerId : uid("cash")) : customerId;
    const finalCustomerName = customerType === "Cash" ? (cashName.trim() || "Cash Customer") : customer.name;
    const finalCustomerPhone = customerType === "Cash" ? cashPhone.trim() : (customer.phone || "");
    const finalCustomerAddress = customerType === "Cash" ? cashAddress.trim() : (customer.address || "");
    const finalPaymentReceived = customerType === "Cash" ? total : (Number(paymentReceived) || 0);
    const finalBalanceDue = total - finalPaymentReceived;

    const base = {
      customerId: finalCustomerId,
      customerName: finalCustomerName,
      customerPhone: finalCustomerPhone,
      customerAddress: finalCustomerAddress,
      customerType,
      // A Cash Customer / Walk-In invoice belongs to the branch that
      // created it (there is no customer record to derive the branch
      // from), so it stays visible in that branch's invoice list.
      branchId: currentUser?.branchId || "",
      previousOutstanding: customerType === "Cash" ? 0 : previousOutstanding,
      date,
      // BUGFIX: item qty (which may be a fractional Feet/Meter/KG/Liter/
      // Sq.Ft amount) and total are rounded so the per-unit rate derived
      // later (total ÷ qty) is stable instead of drifting.
      items: cleanItems.map((it) => ({ name: it.name, unit: it.unit || "", qty: roundQty(it.qty), price: roundMoney(it.price), total: roundMoney(roundQty(it.qty) * Number(it.price)) })),
      rickshawRent: Number(rickshawRent) || 0,
      deliveryCharges: Number(deliveryCharges) || 0,
      discount: Number(discount) || 0,
      driverId: matchedDriver ? matchedDriver.code : "",
      driverName: matchedDriver ? matchedDriver.name : manualDriverName,
      vehicleType: matchedDriver ? matchedDriver.vehicleType : "",
      vehicleNumber: matchedDriver ? matchedDriver.vehicleNumber : "",
      receivedBy,
      subtotal,
      total,
      paymentReceived: finalPaymentReceived,
      balanceDue: finalBalanceDue,
      status: customerType === "Cash" ? "Paid" : (finalBalanceDue <= 0 ? "Paid" : finalPaymentReceived > 0 ? "Partial" : "Unpaid"),
      issuedTo,
      // Commission is a reference only — never affects subtotal/total above.
      commissionAgentId: commissionAgentId || "",
    };

    if (isEdit) {
      onSave({
        ...editingInvoice,
        ...base,
        // Preserve identity + lifecycle fields
        id: editingInvoice.id,
        number: editingInvoice.number,
      });
    } else {
      onSave({
        id: uid("inv"),
        number: nextNumber,
        ...base,
        docStatus: "Active",
        editHistory: [],
        fromBookingId: prefill?.sourceType === "booking" ? prefill.sourceId : "",
        bookingRef: prefill?.sourceType === "booking" ? prefill.sourceCode : "",
        fromOrderId: prefill?.sourceType === "order" ? prefill.sourceId : "",
        orderRef: prefill?.sourceType === "order" ? prefill.sourceCode : "",
      });
    }
  }

  return (
    <div>
      {prefill && (
        <div className="bg-blue-50 border border-blue-200 p-3 mb-3 text-xs">
          <div className="font-black uppercase text-blue-700">
            {prefill.sourceType === "booking" ? `Advance Booking ${prefill.sourceCode} se banaya ja raha hai` : `Order ${prefill.sourceCode} se banaya ja raha hai`}
          </div>
          {prefill.sourceType === "booking" && (
            <div className="text-blue-700 mt-0.5">Rate lock hai — is item ka daam invoice mein change na karein, warna customer se galat charge hoga.</div>
          )}
        </div>
      )}
      {canChangeCustomerType ? (
        <Field label="Customer Type">
          <div className="flex gap-2">
            <button type="button" onClick={() => setCustomerType("Regular")} className={`flex-1 px-3 py-2 text-sm font-bold uppercase tracking-wide border ${customerType === "Regular" ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-300"}`}>Regular Customer</button>
            <button type="button" onClick={() => setCustomerType("Cash")} className={`flex-1 px-3 py-2 text-sm font-bold uppercase tracking-wide border ${customerType === "Cash" ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-300"}`}>Cash Customer / Walk-In</button>
          </div>
        </Field>
      ) : (
        <div className="text-[11px] uppercase tracking-wide font-bold text-slate-400 mb-2">
          {customerType === "Cash" ? "Cash Customer / Walk-In Invoice" : "Regular Customer Invoice"}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {customerType === "Regular" && (
          <Field label="Customer">
            <select className={inputCls} value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
        )}
        <Field label="Date">
          <input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
      </div>

      {customerType === "Cash" && (
        <div className="bg-blue-50 border border-blue-200 p-3 mb-3">
          <div className="text-[11px] uppercase tracking-wide font-bold text-blue-700 mb-2">Cash Customer / Walk-In Details (Optional)</div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Customer Name (optional)">
              <input className={inputCls} placeholder="Cash Customer" value={cashName} onChange={(e) => setCashName(e.target.value)} />
            </Field>
            <Field label="Phone Number (optional)">
              <input className={inputCls} value={cashPhone} onChange={(e) => setCashPhone(e.target.value)} />
            </Field>
          </div>
          <Field label="Address (optional)">
            <input className={inputCls} value={cashAddress} onChange={(e) => setCashAddress(e.target.value)} />
          </Field>
          <div className="text-[11px] text-blue-700">Customer account, portal, credit limit ya outstanding ledger nahi banega — sirf cash sale invoice.</div>
        </div>
      )}

      {selectedCustomer && (
        <div className="bg-slate-50 border border-slate-200 p-3 mb-3 text-sm">
          <div className="grid grid-cols-2 gap-y-1">
            <div><span className="text-slate-500">Phone:</span> <span className="font-bold">{selectedCustomer.phone || "-"}</span></div>
            <div><span className="text-slate-500">Credit Limit:</span> <span className="font-bold">{fmtMoney(selectedCustomer.creditLimit)}</span></div>
            <div className="col-span-2"><span className="text-slate-500">Address:</span> <span className="font-bold">{selectedCustomer.address || "-"}</span></div>
            <div className="col-span-2 pt-1 border-t border-slate-200 mt-1">
              <span className="text-slate-500">Current Outstanding {isEdit ? "(before this invoice, at time of creation)" : "(before this invoice)"}:</span>{" "}
              <span className={`font-black ${previousOutstanding > 0 ? "text-red-600" : "text-emerald-600"}`}>{fmtMoney(previousOutstanding)}</span>
            </div>
          </div>
        </div>
      )}

      <div className="text-[11px] uppercase tracking-wide font-bold text-slate-500 mb-1 mt-3">Items</div>
      <div className="text-[10px] text-slate-400 mb-2">Tip: for products sold by Feet / Meter / KG / Liter / Sq.Ft, enter Qty as the total measurable quantity (e.g. 39 for 3 pipes × 13 feet), not the piece count — this is what makes partial returns/exchanges calculate correctly.</div>
      <div className="space-y-2 mb-2">
        {items.map((it) => (
          <div key={it.id} className="flex gap-2 items-center">
            <select className={`${inputCls} w-36`} value={it.productId} onChange={(e) => pickProduct(it.id, e.target.value)}>
              <option value="">Custom item</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <input className={`${inputCls} flex-1`} placeholder="Item name" value={it.name}
              onChange={(e) => updateItem(it.id, { name: e.target.value })} />
            <input list="unit-suggestions" className={`${inputCls} w-24`} placeholder="Unit" value={it.unit || ""} onChange={(e) => updateItem(it.id, { unit: e.target.value })} />
            <input type="number" step="any" className={`${inputCls} w-20`} placeholder="Qty" value={it.qty}
              onChange={(e) => updateItem(it.id, { qty: e.target.value })} />
            <input type="number" step="any" className={`${inputCls} w-24`} placeholder="Price" value={it.price}
              onChange={(e) => updateItem(it.id, { price: e.target.value })} />
            <div className="w-24 text-right text-sm font-bold">{fmtMoney((it.qty || 0) * (it.price || 0))}</div>
            <button onClick={() => removeItem(it.id)} className="text-slate-400 hover:text-red-600 text-lg leading-none">×</button>
          </div>
        ))}
      </div>
      <datalist id="unit-suggestions">{UNIT_OPTS.map((u) => <option key={u} value={u} />)}</datalist>
      <Btn variant="ghost" small onClick={addItem}>+ Add Item</Btn>

      <div className="text-[11px] uppercase tracking-wide font-bold text-slate-500 mb-1 mt-4">Rickshaw &amp; Delivery</div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Rickshaw Rent (Rs)">
          <input type="number" className={inputCls} value={rickshawRent} onChange={(e) => setRickshawRent(e.target.value)} />
        </Field>
        <Field label="Delivery Charges (Rs)">
          <input type="number" className={inputCls} value={deliveryCharges} onChange={(e) => setDeliveryCharges(e.target.value)} />
        </Field>
        <Field label="Driver ID">
          <input
            className={inputCls}
            list="driver-id-list"
            placeholder="e.g. DRV-0001"
            value={driverIdInput}
            onChange={(e) => setDriverIdInput(e.target.value)}
          />
          <datalist id="driver-id-list">
            {drivers.map((d) => <option key={d.id} value={d.code}>{d.name} — {d.vehicleType}</option>)}
          </datalist>
          {driverIdInput.trim() && (
            matchedDriver ? (
              <div className="text-xs text-emerald-600 font-bold mt-1">
                {matchedDriver.name} · {matchedDriver.vehicleType}{matchedDriver.vehicleNumber ? ` (${matchedDriver.vehicleNumber})` : ""}
              </div>
            ) : (
              <div className="text-xs text-red-600 font-bold mt-1">ID nahi mila — Drivers tab mein add karein, ya neeche naam type karein.</div>
            )
          )}
        </Field>
        {!matchedDriver && (
          <Field label="Driver Name (agar ID na ho)">
            <input className={inputCls} value={manualDriverName} onChange={(e) => setManualDriverName(e.target.value)} />
          </Field>
        )}
        <Field label="Payment Received By">
          <input className={inputCls} value={receivedBy} onChange={(e) => setReceivedBy(e.target.value)} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Discount (Rs)">
          <input type="number" className={inputCls} value={discount} onChange={(e) => setDiscount(e.target.value)} />
        </Field>
        {customerType === "Regular" ? (
          <Field label="Payment Received Now (Rs)">
            <input type="number" className={inputCls} value={paymentReceived} onChange={(e) => setPaymentReceived(e.target.value)} />
          </Field>
        ) : (
          <Field label="Cash Received (Auto = Total)">
            <input type="number" className={`${inputCls} bg-slate-100`} value={total} disabled readOnly />
          </Field>
        )}
      </div>

      {(commissionAgents || []).length > 0 && (
        <div className="border-t border-slate-200 mt-3 pt-3">
          <div className="text-[11px] uppercase tracking-wide font-bold text-slate-500 mb-1">Commission Agent (Optional)</div>
          <div className="text-[11px] text-slate-400 mb-2">Commission is tracked separately as a business payable — it never changes the customer's invoice total above.</div>
          <Field label="Commission Agent">
            <select className={inputCls} value={commissionAgentId} onChange={(e) => setCommissionAgentId(e.target.value)}>
              <option value="">No Agent</option>
              {(commissionAgents || []).filter((a) => a.status === "Active").map((a) => (
                <option key={a.id} value={a.id}>{a.name} ({a.id})</option>
              ))}
            </select>
          </Field>
          {selectedAgent && (
            <div className="bg-amber-50 border border-amber-200 p-3 text-sm space-y-1">
              {commissionPreview.lines.length === 0 && (
                <div className="text-slate-500 text-xs">Is agent/invoice ke liye koi active commission rule match nahi hui.</div>
              )}
              {commissionPreview.lines.map((l, idx) => (
                <div key={idx} className="flex justify-between text-xs text-slate-600">
                  <span>{l.source} ({fmtCommissionRate(l.commissionType, l.commissionRate)})</span>
                  <span className="font-bold">{fmtMoney(l.commission)}</span>
                </div>
              ))}
              <div className="flex justify-between border-t border-amber-300 pt-1 mt-1">
                <span className="font-black uppercase text-amber-700 text-xs">Estimated Commission</span>
                <span className="font-black text-amber-700">{fmtMoney(commissionPreview.total)}</span>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="border-t border-slate-200 mt-3 pt-3">
        <div className="text-[11px] uppercase tracking-wide font-bold text-slate-500 mb-1">Material Issued To (agar account owner khud collect nahi kar raha)</div>
        <div className="text-[11px] text-slate-400 mb-2">Customer account waisa hi rahega — sirf ye note hoga ke material kis ne collect kiya.</div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Issued To Name">
            <input className={inputCls} list="issued-to-list" placeholder="e.g. Aslam" value={issuedToName} onChange={(e) => setIssuedToName(e.target.value)} />
            <datalist id="issued-to-list">{previousIssuedTo.map((n) => <option key={n} value={n} />)}</datalist>
          </Field>
          <Field label="Mobile Number (Optional)">
            <input className={inputCls} value={issuedToPhone} onChange={(e) => setIssuedToPhone(e.target.value)} />
          </Field>
          <Field label="Relation">
            <select className={inputCls} value={issuedToRelation} onChange={(e) => setIssuedToRelation(e.target.value)}>
              <option value="">Select</option>
              <option>Worker</option><option>Mistri</option><option>Driver</option><option>Supervisor</option><option>Family</option><option>Other</option>
            </select>
          </Field>
          <Field label="Remarks">
            <input className={inputCls} value={issuedToRemarks} onChange={(e) => setIssuedToRemarks(e.target.value)} />
          </Field>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 p-3 mt-2 text-sm space-y-1">
        <div className="flex justify-between text-slate-500"><span>Previous Balance</span><span>{fmtMoney(previousOutstanding)}</span></div>
        <div className="flex justify-between"><span>New Purchase</span><span className="font-bold">{fmtMoney(subtotal)}</span></div>
        <div className="flex justify-between"><span>Rickshaw + Delivery</span><span className="font-bold">{fmtMoney((Number(rickshawRent) || 0) + (Number(deliveryCharges) || 0))}</span></div>
        <div className="flex justify-between"><span>Discount</span><span className="font-bold">-{fmtMoney(discount)}</span></div>
        <div className="flex justify-between"><span>Payment Received</span><span className="font-bold">-{fmtMoney(paymentReceived)}</span></div>
        <div className="flex justify-between text-base border-t border-slate-300 pt-1"><span className="font-bold">Outstanding Balance</span><span className="font-black text-red-600">{fmtMoney(previousOutstanding + balanceDue)}</span></div>
      </div>

      <div className="flex gap-2 mt-4">
        <Btn onClick={submit}>{isEdit ? `Save Changes to Invoice ${editingInvoice.number}` : `Save Invoice ${nextNumber}`}</Btn>
        <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
      </div>
    </div>
  );
}

function invoiceStatusBanner(invoice) {
  if (invoice.docStatus === "Cancelled") return { text: "Invoice Cancelled — Reversed From Ledger", tone: "slate" };
  const thisPaid = invoice.balanceDue <= 0;
  const prevDue = (invoice.previousOutstanding || 0) > 0;
  if (thisPaid && !prevDue) return { text: "Paid in Full", tone: "emerald" };
  if (thisPaid && prevDue) return { text: "This Invoice Paid \u00B7 Previous Outstanding Still Due", tone: "amber" };
  if (invoice.paymentReceived > 0) return { text: `Partial Payment Received \u2014 Balance Due on Current Purchase${prevDue ? " \u00B7 Previous Outstanding Still Due" : ""}`, tone: "amber" };
  return { text: `Unpaid \u2014 Balance Due on Current Purchase${prevDue ? " \u00B7 Previous Outstanding Still Due" : ""}`, tone: "red" };
}

function InvoiceDetail({ invoice, settings, returns, exchanges, commissionInfo, onClose, onEdit, onCancelInvoice, onGoToReturn, onGoToExchange, onCreateNewFromInvoice }) {
  const banner = invoiceStatusBanner(invoice);
  const bannerCls = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-blue-50 text-blue-700 border-blue-200",
    red: "bg-red-50 text-red-700 border-red-200",
    slate: "bg-slate-100 text-slate-600 border-slate-300",
  }[banner.tone];
  const outstandingNow = (invoice.previousOutstanding || 0) + invoice.balanceDue;
  const hasDelivery = invoice.rickshawRent > 0 || invoice.deliveryCharges > 0 || invoice.driverName || invoice.receivedBy;
  const isCancelled = invoice.docStatus === "Cancelled";

  const rs = (returns && exchanges) ? computeInvoiceReturnStatus(invoice, returns, exchanges) : null;
  const myReturns = returns ? returnsForInvoice(invoice.id, returns) : [];
  const myExchanges = exchanges ? exchangesForInvoice(invoice.id, exchanges) : [];

  return (
    <Modal title={`Invoice ${invoice.number}`} onClose={onClose} wide>
      <div id="print-invoice" className="bg-white">
        <div className="flex justify-between items-start pb-4 border-b-4 border-slate-900 mb-4">
          <div className="flex items-center gap-3">
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt="Logo" className="w-14 h-14 object-contain" />
            ) : (
              <div className="w-14 h-14 bg-slate-900 flex items-center justify-center font-black text-xl text-white">CT</div>
            )}
            <div>
              <div className="text-xl font-black uppercase tracking-tight text-slate-900">{settings.companyName}</div>
              <div className="text-[11px] uppercase tracking-wide font-bold text-blue-700">Construction Materials Supplier</div>
            </div>
          </div>
          <div className="text-right text-xs text-slate-500">
            <div>{settings.companyAddress}</div>
            {settings.companyPhone && <div>Ph: {settings.companyPhone}</div>}
          </div>
        </div>

        <div className="flex justify-between items-start mb-4">
          <div className="text-sm">
            <div className="text-[11px] uppercase tracking-wide font-bold text-slate-400 mb-0.5">Bill To</div>
            <div className="font-bold text-slate-900">{invoice.customerName}</div>
            {invoice.customerPhone && <div className="text-slate-500">{invoice.customerPhone}</div>}
            {invoice.customerAddress && <div className="text-slate-500">{invoice.customerAddress}</div>}
            {invoice.issuedTo?.name && (
              <div className="mt-2 text-xs bg-blue-50 border border-blue-200 px-2 py-1 inline-block">
                <span className="text-blue-700 font-bold uppercase">Material Issued To:</span>{" "}
                <span className="font-bold text-slate-900">{invoice.issuedTo.name}</span>
                {invoice.issuedTo.relation && <span className="text-slate-500"> ({invoice.issuedTo.relation})</span>}
                {invoice.issuedTo.phone && <span className="text-slate-500"> · {invoice.issuedTo.phone}</span>}
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="inline-block bg-slate-900 text-white font-black px-3 py-1 text-sm">{invoice.number}</div>
            <div className="text-xs text-slate-500 mt-1">Date: <span className="font-bold text-slate-700">{fmtDate(invoice.date)}</span></div>
            {invoice.customerType === "Cash" && (
              <div className="inline-block mt-1 text-[10px] font-bold uppercase px-2 py-0.5 bg-amber-100 text-amber-700">Cash Sale</div>
            )}
            {rs && rs.status !== "Normal" && (
              <div className={`inline-block mt-1 text-[10px] font-bold uppercase px-2 py-0.5 ${RETURN_STATUS_TONE[rs.status]}`}>{rs.status}</div>
            )}
          </div>
        </div>

        <table className="w-full text-sm mb-4">
          <thead>
            <tr className="bg-slate-900 text-white text-[11px] uppercase tracking-wide">
              <th className="py-2 px-2 text-left">Item</th>
              <th className="py-2 px-2 text-right">Qty (Sold)</th>
              <th className="py-2 px-2 text-right">Unit</th>
              <th className="py-2 px-2 text-right">Rate / Unit</th>
              <th className="py-2 px-2 text-right">Amount</th>
              {rs && <th className="py-2 px-2 text-right">Returned</th>}
              {rs && <th className="py-2 px-2 text-right">Remaining</th>}
            </tr>
          </thead>
          <tbody>
            {(rs ? rs.breakdown : invoice.items).map((it, idx) => (
              <tr key={idx} className="border-b border-slate-100">
                <td className="py-2 px-2">{it.name}</td>
                <td className="py-2 px-2 text-right">{fmtQty(it.qty)}</td>
                <td className="py-2 px-2 text-right text-slate-500">{it.unit || "-"}</td>
                <td className="py-2 px-2 text-right">{fmtMoney(it.price)}</td>
                <td className="py-2 px-2 text-right font-bold">{fmtMoney(it.total)}</td>
                {rs && <td className="py-2 px-2 text-right text-slate-500">{(it.returnedQty || 0) + (it.exchangedQty || 0) > 0 ? fmtQty(it.returnedQty + it.exchangedQty) : "-"}</td>}
                {rs && <td className="py-2 px-2 text-right text-slate-500">{fmtQty(it.remainingQty)}</td>}
              </tr>
            ))}
          </tbody>
        </table>

        {hasDelivery && (
          <div className="mb-4 text-sm">
            <div className="font-bold text-slate-900 mb-1">Rickshaw &amp; Delivery Details</div>
            <div className="text-xs text-slate-500 space-y-0.5">
              {invoice.driverName && (
                <div>
                  Driver: {invoice.driverName}
                  {invoice.driverId ? ` (${invoice.driverId})` : ""}
                  {invoice.vehicleType ? ` — ${invoice.vehicleType}` : ""}
                  {invoice.vehicleNumber ? ` [${invoice.vehicleNumber}]` : ""}
                </div>
              )}
              <div>Rickshaw Rent: {fmtMoney(invoice.rickshawRent)}</div>
              <div>Delivery Charges: {fmtMoney(invoice.deliveryCharges)}</div>
              <div>Payment Received By: {invoice.receivedBy || "-"}</div>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <div className="w-72 text-sm space-y-1.5">
            <div className="flex justify-between"><span className="text-slate-500">Previous Balance</span><span className="font-bold">{fmtMoney(invoice.previousOutstanding || 0)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">New Purchase</span><span className="font-bold">{fmtMoney(invoice.subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Rickshaw + Delivery</span><span className="font-bold">{fmtMoney((invoice.rickshawRent || 0) + (invoice.deliveryCharges || 0))}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Discount</span><span className="font-bold">-{fmtMoney(invoice.discount || 0)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Payment Received</span><span className="font-bold">-{fmtMoney(invoice.paymentReceived)}</span></div>
            <div className="flex justify-between border-t-2 border-slate-900 pt-2 mt-1">
              <span className="font-black uppercase text-blue-700">Outstanding Balance</span>
              <span className="font-black text-lg text-blue-700">{fmtMoney(outstandingNow)}</span>
            </div>
          </div>
        </div>

        <div className={`mt-4 border px-3 py-2 text-xs font-bold text-center ${bannerCls}`}>
          ⚠ {banner.text}
        </div>
      </div>

      {commissionInfo && (
        <div className="mt-4 text-xs bg-amber-50 border border-amber-200 px-3 py-2 print:hidden flex items-center justify-between">
          <div>
            <span className="font-black uppercase text-amber-700">Commission:</span>{" "}
            <span className="font-bold text-slate-700">{commissionInfo.agentName}</span>{" "}
            <span className="font-bold">{fmtMoney(commissionInfo.commissionAmount)}</span>
          </div>
          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 ${COMMISSION_STATUS_TONE[commissionInfo.status] || "bg-slate-100 text-slate-500"}`}>{tStatus(commissionInfo.status)}</span>
        </div>
      )}

      {(myReturns.length > 0 || myExchanges.length > 0) && (
        <div className="mt-4 print:hidden">
          <div className="text-[11px] uppercase tracking-wide font-bold text-slate-500 mb-1">Sales Return &amp; Exchange History</div>
          <div className="border border-slate-200 divide-y divide-slate-100">
            {myReturns.map((r) => (
              <div key={r.id} className="px-3 py-2 text-xs flex justify-between items-center">
                <div>
                  <span className="font-black text-blue-700">{r.code}</span> — Sales Return
                  <div className="text-slate-400">{fmtDate(r.date)} · {r.reason}{r.status === "Deleted" ? " · DELETED" : ""} · Qty {fmtQty((r.items || []).reduce((s, it) => s + (Number(it.qtyReturned) || 0), 0))}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-emerald-600">{fmtMoney(r.amount)}</span>
                  {onGoToReturn && <button className="font-bold text-blue-700 hover:underline" onClick={() => onGoToReturn(r)}>View</button>}
                </div>
              </div>
            ))}
            {myExchanges.map((ex) => (
              <div key={ex.id} className="px-3 py-2 text-xs flex justify-between items-center">
                <div>
                  <span className="font-black text-blue-700">{ex.code}</span> — Exchange
                  <div className="text-slate-400">{fmtDate(ex.date)} · {ex.reason}{ex.status === "Deleted" ? " · DELETED" : ""} · Ret Qty {fmtQty((ex.returnedItems || []).reduce((s, it) => s + (Number(it.qty) || 0), 0))} / New Qty {fmtQty((ex.newItems || []).reduce((s, it) => s + (Number(it.qty) || 0), 0))}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`font-bold ${ex.difference >= 0 ? "text-red-600" : "text-emerald-600"}`}>{ex.difference >= 0 ? "+" : "-"}{fmtMoney(Math.abs(ex.difference))}</span>
                  {onGoToExchange && <button className="font-bold text-blue-700 hover:underline" onClick={() => onGoToExchange(ex)}>View</button>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {rs && rs.isLocked && (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-700 text-xs font-bold px-3 py-2 print:hidden">
          This invoice has been fully returned. Please create a new invoice.
          {onCreateNewFromInvoice && (
            <button className="ml-2 underline" onClick={() => onCreateNewFromInvoice(invoice)}>Create New Invoice</button>
          )}
        </div>
      )}

      {invoice.editHistory && invoice.editHistory.length > 0 && (
        <div className="mt-4 print:hidden">
          <div className="text-[11px] uppercase tracking-wide font-bold text-slate-500 mb-1">Edit History</div>
          <div className="border border-slate-200 divide-y divide-slate-100 max-h-40 overflow-y-auto">
            {[...invoice.editHistory].reverse().map((h, idx) => (
              <div key={idx} className="px-3 py-2 text-xs">
                <div className="font-bold text-slate-700">{h.action} — {h.editedBy}</div>
                <div className="text-slate-400">{fmtDateTime(h.editedAt)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 flex gap-2 flex-wrap print:hidden">
        <Btn onClick={() => window.print()}>Print / Save as PDF</Btn>
        <a href={waLink(invoice.customerPhone, buildInvoiceWaMessage(invoice, settings))} target="_blank" rel="noreferrer">
          <Btn variant="dark">Share on WhatsApp</Btn>
        </a>
        {!isCancelled && onEdit && <Btn variant="ghost" onClick={() => onEdit(invoice)}>Edit Invoice</Btn>}
        {!isCancelled && onCancelInvoice && (
          <Btn variant="danger" onClick={() => { if (confirm(`Invoice ${invoice.number} cancel karein? Ye ledger se reverse ho jayegi.`)) onCancelInvoice(invoice); }}>
            Cancel Invoice
          </Btn>
        )}
        <Btn variant="ghost" onClick={onClose}>Close</Btn>
      </div>
      {!invoice.customerPhone && (
        <div className="text-xs text-red-600 mt-2 print:hidden">Is customer ka phone number save nahi hai — WhatsApp share ke liye Customers tab mein add karein.</div>
      )}
    </Modal>
  );
}

function buildInvoiceWaMessage(invoice, settings) {
  const outstandingNow = (invoice.previousOutstanding || 0) + invoice.balanceDue;
  const lines = [
    `${settings.companyName} — Invoice ${invoice.number}${invoice.docStatus === "Cancelled" ? " (CANCELLED)" : ""}`,
    `Date: ${fmtDate(invoice.date)}`,
    `Customer: ${invoice.customerName}`,
    ...(invoice.issuedTo?.name ? [`Material Issued To: ${invoice.issuedTo.name}${invoice.issuedTo.relation ? ` (${invoice.issuedTo.relation})` : ""}`] : []),
    "",
    ...invoice.items.map((it) => `${it.name} x${it.qty}${it.unit ? " " + it.unit : ""} = ${fmtMoney(it.total)}`),
    "",
    `New Purchase: ${fmtMoney(invoice.subtotal)}`,
    `Received: ${fmtMoney(invoice.paymentReceived)}`,
    `Balance Due (this invoice): ${fmtMoney(invoice.balanceDue)}`,
    `Total Outstanding Balance: ${fmtMoney(outstandingNow)}`,
  ];
  return lines.join("\n");
}

function Invoices({ customers, products, drivers, invoices, payments, returns, exchanges, promises, transfers, adjustments, commissionAgents, commissionRules, commissionTransactions, bookings, settings, currentUser, saveInvoice, updateInvoice, cancelInvoice, prefill, onClearPrefill, onBookingFulfilled, onOrderFulfilled, focusInvoiceId, setFocusInvoiceId, onGoToReturn, onGoToExchange }) {
  const [showForm, setShowForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [viewing, setViewing] = useState(null);
  const nextNumber = "CT-" + String(settings.invoiceCounter).padStart(4, "0");

  useEffect(() => {
    if (prefill) setShowForm(true);
  }, [prefill]);

  // Opened from global search / linked-record navigation.
  useEffect(() => {
    if (focusInvoiceId) {
      const inv = invoices.find((i) => i.id === focusInvoiceId);
      if (inv) setViewing(inv);
      setFocusInvoiceId(null);
    }
  }, [focusInvoiceId]);

  function closeForm() {
    setShowForm(false);
    setEditingInvoice(null);
    if (prefill) onClearPrefill();
  }

  function openEdit(inv) {
    setViewing(null);
    setEditingInvoice(inv);
    setShowForm(true);
  }

  function handleCancelInvoice(inv) {
    cancelInvoice(inv);
    setViewing({ ...inv, docStatus: "Cancelled" });
  }

  function commissionInfoFor(inv) {
    const tx = (commissionTransactions || []).find((c) => c.invoiceId === inv.id && c.status !== "Cancelled");
    if (!tx) return null;
    const agent = (commissionAgents || []).find((a) => a.id === tx.agentId);
    return { agentName: agent ? agent.name : tx.agentName, commissionAmount: tx.commissionAmount, status: tx.status };
  }

  const sorted = [...invoices].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-black uppercase tracking-tight">Invoices</h2>
        <Btn onClick={() => setShowForm(true)}>+ New Invoice</Btn>
      </div>
      {customers.length === 0 && <div className="text-slate-400 mb-3">Regular customer ke liye pehle Customers tab mein customer add karein — Cash Customer / Walk-In invoice abhi bhi bana sakte hain.</div>}
      <div className="bg-white border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-slate-200">
              <th className="px-4 py-2">Number</th><th className="px-4 py-2">Customer</th><th className="px-4 py-2">Type</th><th className="px-4 py-2">Date</th>
              <th className="px-4 py-2 text-right">Total</th><th className="px-4 py-2 text-right">Due</th><th className="px-4 py-2">Status</th><th className="px-4 py-2">Return/Exchange</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && <tr><td colSpan={8} className="px-4 py-6 text-center text-slate-400">Koi invoice nahi bana.</td></tr>}
            {sorted.map((inv) => {
              const rs = computeInvoiceReturnStatus(inv, returns, exchanges);
              return (
                <tr key={inv.id} className={`border-t border-slate-100 cursor-pointer hover:bg-slate-50 ${inv.docStatus === "Cancelled" ? "opacity-50" : ""}`} onClick={() => setViewing(inv)}>
                  <td className="px-4 py-2 font-bold text-blue-700">{inv.number}</td>
                  <td className="px-4 py-2">{inv.customerName}</td>
                  <td className="px-4 py-2">
                    {inv.customerType === "Cash" ? (
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-amber-100 text-amber-700">Cash Sale</span>
                    ) : (
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-slate-100 text-slate-500">Regular</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-slate-500">{fmtDate(inv.date)}</td>
                  <td className="px-4 py-2 text-right font-bold">{fmtMoney(inv.total)}</td>
                  <td className="px-4 py-2 text-right text-red-600 font-bold">{inv.docStatus !== "Cancelled" && inv.balanceDue > 0 ? fmtMoney(inv.balanceDue) : "-"}</td>
                  <td className="px-4 py-2">
                    {inv.docStatus === "Cancelled" ? (
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-slate-200 text-slate-600">Cancelled</span>
                    ) : (
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 ${inv.status === "Paid" ? "bg-emerald-100 text-emerald-700" : inv.status === "Partial" ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"}`}>{inv.status}</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {rs.status !== "Normal" && (
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 ${RETURN_STATUS_TONE[rs.status]}`}>{rs.status}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {showForm && (
        <Modal title={editingInvoice ? `Edit Invoice ${editingInvoice.number}` : prefill ? `New Invoice — from ${prefill.sourceCode}` : "New Invoice"} onClose={closeForm} wide>
          <InvoiceForm
            customers={customers}
            products={products}
            drivers={drivers}
            bookings={bookings}
            invoices={invoices}
            payments={payments}
            returns={returns}
            exchanges={exchanges}
            promises={promises}
            transfers={transfers}
            adjustments={adjustments}
            commissionAgents={commissionAgents}
            commissionRules={commissionRules}
            prefill={editingInvoice ? null : prefill}
            editingInvoice={editingInvoice}
            currentUser={currentUser}
            nextNumber={nextNumber}
            onCancel={closeForm}
            onSave={(inv) => {
              if (editingInvoice) {
                updateInvoice(inv, editingInvoice);
              } else {
                saveInvoice(inv);
                if (prefill) {
                  if (prefill.sourceType === "order") onOrderFulfilled(prefill.sourceId);
                  else onBookingFulfilled(prefill.sourceId);
                  onClearPrefill();
                }
              }
              setShowForm(false);
              setEditingInvoice(null);
            }}
          />
        </Modal>
      )}
      {viewing && (
        <InvoiceDetail
          invoice={viewing}
          settings={settings}
          returns={returns}
          exchanges={exchanges}
          commissionInfo={commissionInfoFor(viewing)}
          onClose={() => setViewing(null)}
          onEdit={openEdit}
          onCancelInvoice={handleCancelInvoice}
          onGoToReturn={onGoToReturn}
          onGoToExchange={onGoToExchange}
          onCreateNewFromInvoice={(inv) => { setViewing(null); setShowForm(true); }}
        />
      )}
    </div>
  );
}

/* ---------------- Invoice History (Phase 1) ---------------- */

function InvoiceHistoryPage({ invoices, auditLog }) {
  const rows = [];
  invoices.forEach((inv) => {
    (inv.editHistory || []).forEach((h) => {
      rows.push({ ...h, invoiceNumber: inv.number, customerName: inv.customerName, invoiceId: inv.id });
    });
  });
  rows.sort((a, b) => new Date(b.editedAt) - new Date(a.editedAt));

  const auditRows = [...(auditLog || [])].sort((a, b) => new Date(b.at) - new Date(a.at));

  return (
    <div>
      <h2 className="text-xl font-black uppercase tracking-tight mb-4">Invoice History</h2>
      <div className="text-xs text-slate-400 mb-4 max-w-2xl">
        Har invoice edit aur cancellation yahan log hoti hai — kis ne, kab, aur kya badla.
      </div>
      <div className="bg-white border border-slate-200 overflow-x-auto mb-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-slate-200">
              <th className="px-4 py-2">Invoice</th><th className="px-4 py-2">Customer</th><th className="px-4 py-2">Action</th>
              <th className="px-4 py-2">Edited By</th><th className="px-4 py-2">Date/Time</th><th className="px-4 py-2">Details</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400">Abhi tak koi edit ya cancellation nahi hui.</td></tr>}
            {rows.map((r, idx) => (
              <tr key={idx} className="border-t border-slate-100 align-top">
                <td className="px-4 py-2 font-bold text-blue-700">{r.invoiceNumber}</td>
                <td className="px-4 py-2">{r.customerName}</td>
                <td className="px-4 py-2">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 ${r.action === "Cancelled" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>{r.action}</span>
                </td>
                <td className="px-4 py-2">{r.editedBy}</td>
                <td className="px-4 py-2 text-slate-500">{fmtDateTime(r.editedAt)}</td>
                <td className="px-4 py-2 text-xs text-slate-500">
                  {r.previousValues && r.newValues ? (
                    <div>
                      {Object.keys(r.newValues).map((k) => (
                        <div key={k}><span className="font-bold">{k}:</span> {String(r.previousValues[k])} → {String(r.newValues[k])}</div>
                      ))}
                    </div>
                  ) : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="text-xl font-black uppercase tracking-tight mb-2">Audit Log</h2>
      <div className="text-xs text-slate-400 mb-4 max-w-2xl">
        Sales Return, Exchange, Delete Return, Delete Exchange, Promise To Pay, Outstanding Transfer, Adjustment, Commission, aur Invoice Status Change ki har action yahan record hoti hai — user, date, time aur reason ke saath.
      </div>
      <div className="bg-white border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-slate-200">
              <th className="px-4 py-2">Action</th><th className="px-4 py-2">Reference</th><th className="px-4 py-2">User</th>
              <th className="px-4 py-2">Date/Time</th><th className="px-4 py-2">Reason</th>
            </tr>
          </thead>
          <tbody>
            {auditRows.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">Abhi tak koi audit entry nahi.</td></tr>}
            {auditRows.map((a) => (
              <tr key={a.id} className="border-t border-slate-100 align-top">
                <td className="px-4 py-2">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-slate-100 text-slate-700">{a.action}</span>
                </td>
                <td className="px-4 py-2 font-bold text-blue-700">{a.reference}</td>
                <td className="px-4 py-2">{a.user}</td>
                <td className="px-4 py-2 text-slate-500">{fmtDateTime(a.at)}</td>
                <td className="px-4 py-2 text-slate-500">{a.reason || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------- Sales Return (Phase 2 + Upgrade) ---------------- */

function SalesReturnPage({ customers, invoices, returns, exchanges, onCreateReturn, onDeleteReturn, currentUser }) {
  const [customerId, setCustomerId] = useState(customers[0]?.id || "");
  const [invoiceId, setInvoiceId] = useState("");
  const [returnQtys, setReturnQtys] = useState({});
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [returnDate, setReturnDate] = useState(todayISO());
  const [deletingReturn, setDeletingReturn] = useState(null);
  const [deleteReason, setDeleteReason] = useState("");

  const customerInvoices = invoices.filter((i) => i.customerId === customerId && i.docStatus !== "Cancelled");
  const invoice = customerInvoices.find((i) => i.id === invoiceId);
  const rs = invoice ? computeInvoiceReturnStatus(invoice, returns, exchanges) : null;

  useEffect(() => { setInvoiceId(""); setReturnQtys({}); }, [customerId]);
  useEffect(() => { setReturnQtys({}); }, [invoiceId]);

  // BUGFIX (partial qty/length): Return Amount = Returned Qty × Per Unit
  // Rate, where Per Unit Rate = Original Line Amount ÷ Original Sold Qty
  // (it.perUnitRate, computed in computeInvoiceItemBreakdown). We never
  // multiply by a piece count — only by the qty entered here, which is
  // expected in the same unit the item was originally sold in (Feet,
  // Meter, KG, Liter, Sq.Ft, Bag, etc). Rounded with roundMoney to avoid
  // floating point drift (e.g. Rs 738.4799999999999 → Rs 738.48).
  const returnAmount = invoice && rs
    ? roundMoney(rs.breakdown.reduce((sum, it) => sum + roundQty(Number(returnQtys[it.itemIndex]) || 0) * it.perUnitRate, 0))
    : 0;

  function submit() {
    if (!invoice || !rs) { alert("Pehle invoice select karein."); return; }
    if (rs.isLocked) { alert("Ye invoice fully returned ho chuki hai. Nayi invoice banayein."); return; }
    const items = rs.breakdown
      .map((it) => ({
        itemIndex: it.itemIndex, name: it.name, unit: it.unit,
        qtyReturned: roundQty(Number(returnQtys[it.itemIndex]) || 0),
        price: it.perUnitRate,
        total: roundMoney(roundQty(Number(returnQtys[it.itemIndex]) || 0) * it.perUnitRate),
      }))
      .filter((it) => it.qtyReturned > 0);
    if (items.length === 0) { alert("Kam az kam ek item ki return qty daalein."); return; }
    const invalidQty = items.some((it) => {
      const line = rs.breakdown.find((b) => b.itemIndex === it.itemIndex);
      return it.qtyReturned > line.remainingQty + 0.0005; // small epsilon for float-safe comparison
    });
    if (invalidQty) { alert("Return qty remaining quantity se zyada nahi ho sakti."); return; }
    if (!reason.trim()) { alert("Return ki wajah likhein."); return; }
    const customer = customers.find((c) => c.id === customerId);
    onCreateReturn({
      customerId, customerName: customer.name, invoiceId: invoice.id, invoiceNumber: invoice.number,
      date: returnDate, items, reason: reason.trim(), notes: notes.trim(), amount: returnAmount,
    });
    setInvoiceId(""); setReturnQtys({}); setReason(""); setNotes(""); setReturnDate(todayISO());
  }

  function confirmDelete() {
    if (!deleteReason.trim()) { alert("Delete ki wajah likhein."); return; }
    const blockingExchange = exchanges.find((ex) =>
      ex.status !== "Deleted" && ex.invoiceId === deletingReturn.invoiceId &&
      (ex.returnedItems || []).some((exi) => (deletingReturn.items || []).some((ri) => ri.itemIndex === exi.itemIndex))
    );
    if (blockingExchange) {
      alert("This Sales Return has linked Exchange records. Delete the Exchange first.");
      return;
    }
    onDeleteReturn(deletingReturn, deleteReason.trim());
    setDeletingReturn(null); setDeleteReason("");
  }

  const sorted = [...returns].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div>
      <h2 className="text-xl font-black uppercase tracking-tight mb-2">Sales Return</h2>
      <div className="text-xs text-slate-400 mb-4 max-w-2xl">
        Customer se wapis aane wale items yahan record karein — outstanding balance turant kam ho jayega aur ek Credit Note ban jayegi. Feet / Meter / KG / Liter / Sq.Ft jaise items ke liye fractional (decimal) qty bhi daal sakte hain — rate hamesha (Original Line Amount ÷ Original Sold Qty) se calculate hota hai, piece count se nahi.
      </div>

      <div className="bg-white border border-slate-200 p-4 mb-6 max-w-2xl">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Customer">
            <select className={inputCls} value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Invoice">
            <select className={inputCls} value={invoiceId} onChange={(e) => setInvoiceId(e.target.value)}>
              <option value="">Select Invoice</option>
              {customerInvoices.map((i) => {
                const s = computeInvoiceReturnStatus(i, returns, exchanges);
                return <option key={i.id} value={i.id} disabled={s.isLocked}>{i.number} — {fmtDate(i.date)} — {fmtMoney(i.total)}{s.isLocked ? " (Fully Returned)" : ""}</option>;
              })}
            </select>
          </Field>
        </div>

        {invoice && rs && rs.isLocked && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-bold px-3 py-2 mb-2">
            This invoice has been fully returned. Please create a new invoice.
          </div>
        )}

        {invoice && rs && !rs.isLocked && (
          <div className="mt-2">
            <div className="text-[11px] uppercase tracking-wide font-bold text-slate-500 mb-1">Items — Return Qty Daalein (Remaining Qty se zyada nahi; decimal allowed, e.g. 6.5)</div>
            <div className="space-y-2">
              {rs.breakdown.map((it) => (
                <div key={it.itemIndex} className="flex gap-2 items-center border border-slate-200 p-2">
                  <div className="flex-1 text-sm">
                    <div className="font-bold">{it.name}</div>
                    <div className="text-xs text-slate-400">Original Sold Qty: {fmtQty(it.qty)} {it.unit} · Remaining: {fmtQty(it.remainingQty)} · Per Unit Rate: {fmtMoney(it.perUnitRate)}</div>
                  </div>
                  <input
                    type="number" step="any" min="0" max={it.remainingQty}
                    disabled={it.remainingQty <= 0}
                    className={`${inputCls} w-24`}
                    placeholder="Return Qty"
                    value={returnQtys[it.itemIndex] || ""}
                    onChange={(e) => setReturnQtys({ ...returnQtys, [it.itemIndex]: Math.min(Number(e.target.value) || 0, it.remainingQty) })}
                  />
                  <div className="w-24 text-right text-sm font-bold">{fmtMoney(roundQty(Number(returnQtys[it.itemIndex]) || 0) * it.perUnitRate)}</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <Field label="Return Date">
                <input type="date" className={inputCls} value={returnDate} onChange={(e) => setReturnDate(e.target.value)} />
              </Field>
              <Field label="Return Reason">
                <input className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Extra order ho gaya tha" />
              </Field>
            </div>
            <Field label="Notes (optional)">
              <input className={inputCls} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </Field>
            <div className="bg-slate-50 border border-slate-200 p-3 mt-2 text-sm flex justify-between">
              <span className="font-bold">Total Return Amount</span>
              <span className="font-black text-emerald-600">{fmtMoney(returnAmount)}</span>
            </div>
            <Btn onClick={submit}>Save Return &amp; Generate Credit Note</Btn>
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-slate-200">
            <th className="px-4 py-2">Return #</th><th className="px-4 py-2">Original Invoice</th><th className="px-4 py-2">Customer</th>
            <th className="px-4 py-2">Date</th><th className="px-4 py-2 text-right">Qty Returned</th><th className="px-4 py-2 text-right">Amount</th><th className="px-4 py-2">Reason</th><th className="px-4 py-2">Status</th><th></th>
          </tr></thead>
          <tbody>
            {sorted.length === 0 && <tr><td colSpan={9} className="px-4 py-6 text-center text-slate-400">Koi return record nahi.</td></tr>}
            {sorted.map((r) => (
              <tr key={r.id} className={`border-t border-slate-100 ${r.status === "Deleted" ? "opacity-50" : ""}`}>
                <td className="px-4 py-2 font-black text-blue-700">{r.code}</td>
                <td className="px-4 py-2 text-slate-500">{r.invoiceNumber}</td>
                <td className="px-4 py-2 font-bold">{r.customerName}</td>
                <td className="px-4 py-2 text-slate-500">{fmtDate(r.date)}</td>
                <td className="px-4 py-2 text-right text-slate-500">{fmtQty((r.items || []).reduce((s, it) => s + (Number(it.qtyReturned) || 0), 0))}</td>
                <td className="px-4 py-2 text-right font-bold text-emerald-600">{fmtMoney(r.amount)}</td>
                <td className="px-4 py-2 text-slate-500">{r.reason}</td>
                <td className="px-4 py-2">
                  {r.status === "Deleted" ? (
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-slate-200 text-slate-600">Deleted</span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-emerald-100 text-emerald-700">Active</span>
                  )}
                </td>
                <td className="px-4 py-2 text-right whitespace-nowrap">
                  {r.status !== "Deleted" && currentUser?.role === "admin" && (
                    <button className="text-xs font-bold text-slate-500 hover:text-red-600" onClick={() => setDeletingReturn(r)}>Delete</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {deletingReturn && (
        <Modal title={`Delete Return ${deletingReturn.code}`} onClose={() => setDeletingReturn(null)}>
          <div className="text-sm text-slate-600 mb-3">Ye return delete karne se ledger reverse ho jayega, invoice qty aur customer balance wapis restore ho jayega.</div>
          <Field label="Delete Reason">
            <input className={inputCls} value={deleteReason} onChange={(e) => setDeleteReason(e.target.value)} autoFocus />
          </Field>
          <div className="flex gap-2">
            <Btn variant="danger" onClick={confirmDelete}>Confirm Delete</Btn>
            <Btn variant="ghost" onClick={() => setDeletingReturn(null)}>Cancel</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ---------------- Exchange (Phase 2 + Upgrade) ---------------- */

function ExchangePage({ customers, products, invoices, returns, exchanges, onCreateExchange, onDeleteExchange, currentUser }) {
  const [customerId, setCustomerId] = useState(customers[0]?.id || "");
  const [invoiceId, setInvoiceId] = useState("");
  const [returnQtys, setReturnQtys] = useState({});
  const [newItems, setNewItems] = useState([{ id: uid("ni"), productId: "", name: "", unit: "Bag", qty: 1, price: 0 }]);
  const [reason, setReason] = useState("");
  const [deletingExchange, setDeletingExchange] = useState(null);
  const [deleteReason, setDeleteReason] = useState("");

  const customerInvoices = invoices.filter((i) => i.customerId === customerId && i.docStatus !== "Cancelled");
  const invoice = customerInvoices.find((i) => i.id === invoiceId);
  const rs = invoice ? computeInvoiceReturnStatus(invoice, returns, exchanges) : null;

  useEffect(() => { setInvoiceId(""); setReturnQtys({}); }, [customerId]);
  useEffect(() => { setReturnQtys({}); }, [invoiceId]);

  // BUGFIX (partial qty/length): exactly the same rule as Sales Return —
  // Returned Value = Returned Qty × Per Unit Rate (Original Line Amount ÷
  // Original Sold Qty), never re-derived from a piece count.
  const returnedTotal = invoice && rs
    ? roundMoney(rs.breakdown.reduce((sum, it) => sum + roundQty(Number(returnQtys[it.itemIndex]) || 0) * it.perUnitRate, 0))
    : 0;
  const newTotal = roundMoney(newItems.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.price) || 0), 0));
  const difference = roundMoney(newTotal - returnedTotal);

  function updateNewItem(id, patch) {
    setNewItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }
  function addNewItem() {
    setNewItems((prev) => [...prev, { id: uid("ni"), productId: "", name: "", unit: "Bag", qty: 1, price: 0 }]);
  }
  function removeNewItem(id) {
    setNewItems((prev) => (prev.length > 1 ? prev.filter((it) => it.id !== id) : prev));
  }
  function pickProduct(id, productId) {
    const p = products.find((p) => p.id === productId);
    updateNewItem(id, { productId, name: p ? p.name : "", unit: p ? p.unit : "Bag", price: p ? p.price : 0 });
  }

  function submit() {
    if (!invoice || !rs) { alert("Pehle invoice select karein."); return; }
    if (rs.isLocked) { alert("Ye invoice fully returned/exchanged ho chuki hai. Nayi invoice banayein."); return; }
    const returnedItems = rs.breakdown
      .map((it) => ({
        itemIndex: it.itemIndex, name: it.name, unit: it.unit,
        qty: roundQty(Number(returnQtys[it.itemIndex]) || 0),
        price: it.perUnitRate,
        total: roundMoney(roundQty(Number(returnQtys[it.itemIndex]) || 0) * it.perUnitRate),
      }))
      .filter((it) => it.qty > 0);
    const cleanNewItems = newItems.filter((it) => it.name && Number(it.qty) > 0).map((it) => ({ name: it.name, unit: it.unit, qty: roundQty(it.qty), price: roundMoney(it.price), total: roundMoney(roundQty(it.qty) * Number(it.price)) }));
    if (returnedItems.length === 0) { alert("Kam az kam ek returned item ki qty daalein."); return; }
    const invalidQty = returnedItems.some((it) => {
      const line = rs.breakdown.find((b) => b.itemIndex === it.itemIndex);
      return it.qty > line.remainingQty + 0.0005; // small epsilon for float-safe comparison
    });
    if (invalidQty) { alert("Returned qty remaining quantity se zyada nahi ho sakti."); return; }
    if (cleanNewItems.length === 0) { alert("Kam az kam ek naya item daalein jo customer ko diya ja raha hai."); return; }
    if (!reason.trim()) { alert("Exchange ki wajah likhein."); return; }
    const customer = customers.find((c) => c.id === customerId);
    onCreateExchange({
      customerId, customerName: customer.name, invoiceId: invoice.id, invoiceNumber: invoice.number,
      date: todayISO(), returnedItems, newItems: cleanNewItems,
      returnedTotal, newTotal, difference, reason: reason.trim(),
    });
    setInvoiceId(""); setReturnQtys({}); setNewItems([{ id: uid("ni"), productId: "", name: "", unit: "Bag", qty: 1, price: 0 }]); setReason("");
  }

  function confirmDelete() {
    if (!deleteReason.trim()) { alert("Delete ki wajah likhein."); return; }
    onDeleteExchange(deletingExchange, deleteReason.trim());
    setDeletingExchange(null); setDeleteReason("");
  }

  const sorted = [...exchanges].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div>
      <h2 className="text-xl font-black uppercase tracking-tight mb-2">Exchange Items</h2>
      <div className="text-xs text-slate-400 mb-4 max-w-2xl">
        Customer purane items wapis kar ke naye le raha hai — difference apne aap calculate ho kar ledger mein adjust ho jayega. Feet / Meter / KG / Liter / Sq.Ft jaise items ke liye fractional qty bhi daal sakte hain.
      </div>

      <div className="bg-white border border-slate-200 p-4 mb-6 max-w-3xl">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Customer">
            <select className={inputCls} value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Original Invoice">
            <select className={inputCls} value={invoiceId} onChange={(e) => setInvoiceId(e.target.value)}>
              <option value="">Select Invoice</option>
              {customerInvoices.map((i) => {
                const s = computeInvoiceReturnStatus(i, returns, exchanges);
                return <option key={i.id} value={i.id} disabled={s.isLocked}>{i.number} — {fmtDate(i.date)}{s.isLocked ? " (Fully Returned)" : ""}</option>;
              })}
            </select>
          </Field>
        </div>

        {invoice && rs && rs.isLocked && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-bold px-3 py-2 mb-2">
            This invoice has been fully returned. Please create a new invoice.
          </div>
        )}

        {invoice && rs && !rs.isLocked && (
          <div className="mt-2">
            <div className="text-[11px] uppercase tracking-wide font-bold text-slate-500 mb-1">Customer Kya Wapis Kar Raha Hai (Remaining Qty se zyada nahi; decimal allowed)</div>
            <div className="space-y-2 mb-3">
              {rs.breakdown.map((it) => (
                <div key={it.itemIndex} className="flex gap-2 items-center border border-slate-200 p-2">
                  <div className="flex-1 text-sm">
                    <div className="font-bold">{it.name}</div>
                    <div className="text-xs text-slate-400">Original Sold Qty: {fmtQty(it.qty)} {it.unit} · Remaining: {fmtQty(it.remainingQty)} · Per Unit Rate: {fmtMoney(it.perUnitRate)}</div>
                  </div>
                  <input type="number" step="any" min="0" max={it.remainingQty} disabled={it.remainingQty <= 0} className={`${inputCls} w-24`} placeholder="Return Qty"
                    value={returnQtys[it.itemIndex] || ""}
                    onChange={(e) => setReturnQtys({ ...returnQtys, [it.itemIndex]: Math.min(Number(e.target.value) || 0, it.remainingQty) })} />
                  <div className="w-24 text-right text-sm font-bold">{fmtMoney(roundQty(Number(returnQtys[it.itemIndex]) || 0) * it.perUnitRate)}</div>
                </div>
              ))}
            </div>

            <div className="text-[11px] uppercase tracking-wide font-bold text-slate-500 mb-1">Customer Ko Kya Naya Mil Raha Hai</div>
            <div className="space-y-2 mb-2">
              {newItems.map((it) => (
                <div key={it.id} className="flex gap-2 items-center">
                  <select className={`${inputCls} w-36`} value={it.productId} onChange={(e) => pickProduct(it.id, e.target.value)}>
                    <option value="">Custom item</option>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <input className={`${inputCls} flex-1`} placeholder="Item name" value={it.name} onChange={(e) => updateNewItem(it.id, { name: e.target.value })} />
                  <input className={`${inputCls} w-20`} placeholder="Unit" value={it.unit} onChange={(e) => updateNewItem(it.id, { unit: e.target.value })} />
                  <input type="number" step="any" className={`${inputCls} w-16`} placeholder="Qty" value={it.qty} onChange={(e) => updateNewItem(it.id, { qty: e.target.value })} />
                  <input type="number" step="any" className={`${inputCls} w-24`} placeholder="Price" value={it.price} onChange={(e) => updateNewItem(it.id, { price: e.target.value })} />
                  <div className="w-24 text-right text-sm font-bold">{fmtMoney((it.qty || 0) * (it.price || 0))}</div>
                  <button onClick={() => removeNewItem(it.id)} className="text-slate-400 hover:text-red-600 text-lg leading-none">×</button>
                </div>
              ))}
            </div>
            <Btn variant="ghost" small onClick={addNewItem}>+ Add Item</Btn>

            <Field label="Exchange Reason">
              <input className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)} />
            </Field>

            <div className="bg-slate-50 border border-slate-200 p-3 mt-2 text-sm space-y-1">
              <div className="flex justify-between"><span>Returned Value</span><span className="font-bold">-{fmtMoney(returnedTotal)}</span></div>
              <div className="flex justify-between"><span>New Items Value</span><span className="font-bold">{fmtMoney(newTotal)}</span></div>
              <div className="flex justify-between border-t border-slate-300 pt-1">
                <span className="font-bold">{difference >= 0 ? "Extra Charge to Customer" : "Refund Credit to Customer"}</span>
                <span className={`font-black ${difference >= 0 ? "text-red-600" : "text-emerald-600"}`}>{fmtMoney(Math.abs(difference))}</span>
              </div>
            </div>
            <Btn onClick={submit}>Save Exchange</Btn>
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-slate-200">
            <th className="px-4 py-2">Exchange #</th><th className="px-4 py-2">Original Invoice</th><th className="px-4 py-2">Customer</th>
            <th className="px-4 py-2">Date</th><th className="px-4 py-2 text-right">Ret Qty</th><th className="px-4 py-2 text-right">New Qty</th><th className="px-4 py-2 text-right">Difference</th><th className="px-4 py-2">Reason</th><th className="px-4 py-2">Status</th><th></th>
          </tr></thead>
          <tbody>
            {sorted.length === 0 && <tr><td colSpan={10} className="px-4 py-6 text-center text-slate-400">Koi exchange record nahi.</td></tr>}
            {sorted.map((ex) => (
              <tr key={ex.id} className={`border-t border-slate-100 ${ex.status === "Deleted" ? "opacity-50" : ""}`}>
                <td className="px-4 py-2 font-black text-blue-700">{ex.code}</td>
                <td className="px-4 py-2 text-slate-500">{ex.invoiceNumber}</td>
                <td className="px-4 py-2 font-bold">{ex.customerName}</td>
                <td className="px-4 py-2 text-slate-500">{fmtDate(ex.date)}</td>
                <td className="px-4 py-2 text-right text-slate-500">{fmtQty((ex.returnedItems || []).reduce((s, it) => s + (Number(it.qty) || 0), 0))}</td>
                <td className="px-4 py-2 text-right text-slate-500">{fmtQty((ex.newItems || []).reduce((s, it) => s + (Number(it.qty) || 0), 0))}</td>
                <td className={`px-4 py-2 text-right font-bold ${ex.difference >= 0 ? "text-red-600" : "text-emerald-600"}`}>{ex.difference >= 0 ? "+" : "-"}{fmtMoney(Math.abs(ex.difference))}</td>
                <td className="px-4 py-2 text-slate-500">{ex.reason}</td>
                <td className="px-4 py-2">
                  {ex.status === "Deleted" ? (
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-slate-200 text-slate-600">Deleted</span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-emerald-100 text-emerald-700">Active</span>
                  )}
                </td>
                <td className="px-4 py-2 text-right whitespace-nowrap">
                  {ex.status !== "Deleted" && currentUser?.role === "admin" && (
                    <button className="text-xs font-bold text-slate-500 hover:text-red-600" onClick={() => setDeletingExchange(ex)}>Delete</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {deletingExchange && (
        <Modal title={`Delete Exchange ${deletingExchange.code}`} onClose={() => setDeletingExchange(null)}>
          <div className="text-sm text-slate-600 mb-3">Ye exchange delete karne se invoice bilkul waisa ho jayega jaisa exchange se pehle tha — ledger aur outstanding balance restore ho jayenge.</div>
          <Field label="Delete Reason">
            <input className={inputCls} value={deleteReason} onChange={(e) => setDeleteReason(e.target.value)} autoFocus />
          </Field>
          <div className="flex gap-2">
            <Btn variant="danger" onClick={confirmDelete}>Confirm Delete</Btn>
            <Btn variant="ghost" onClick={() => setDeletingExchange(null)}>Cancel</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ---------------- Credit Notes (Phase 2) ---------------- */

function CreditNotesPage({ creditNotes, onLinkInvoice }) {
  const [linkingId, setLinkingId] = useState(null);
  const [linkInvoiceNumber, setLinkInvoiceNumber] = useState("");

  const sorted = [...creditNotes].sort((a, b) => new Date(b.date) - new Date(a.date));

  function startLink(cn) {
    setLinkingId(cn.id);
    setLinkInvoiceNumber("");
  }

  function confirmLink(cn) {
    if (!linkInvoiceNumber.trim()) return;
    onLinkInvoice(cn.id, linkInvoiceNumber.trim());
    setLinkingId(null);
  }

  return (
    <div>
      <h2 className="text-xl font-black uppercase tracking-tight mb-2">Credit Notes</h2>
      <div className="text-xs text-slate-400 mb-4 max-w-2xl">
        Har Sales Return ke baad yahan automatically ek Credit Note ban jati hai. Balance us waqt hi ledger mein adjust ho chuka hota hai — yahan aap sirf reference ke liye kisi future invoice se link kar sakte hain.
      </div>
      <div className="bg-white border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-slate-200">
            <th className="px-4 py-2">Credit Note #</th><th className="px-4 py-2">Date</th><th className="px-4 py-2">Customer</th>
            <th className="px-4 py-2 text-right">Amount</th><th className="px-4 py-2">Reason</th><th className="px-4 py-2">Status</th><th></th>
          </tr></thead>
          <tbody>
            {sorted.length === 0 && <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-400">Koi credit note nahi bani.</td></tr>}
            {sorted.map((cn) => (
              <tr key={cn.id} className="border-t border-slate-100 align-top">
                <td className="px-4 py-2 font-black text-blue-700">{cn.number}</td>
                <td className="px-4 py-2 text-slate-500">{fmtDate(cn.date)}</td>
                <td className="px-4 py-2 font-bold">{cn.customerName}</td>
                <td className="px-4 py-2 text-right font-bold text-emerald-600">{fmtMoney(cn.amount)}</td>
                <td className="px-4 py-2 text-slate-500">{cn.reason}</td>
                <td className="px-4 py-2">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 ${cn.status === "Reversed" ? "bg-slate-200 text-slate-600" : "bg-emerald-100 text-emerald-700"}`}>{cn.status}</span>
                  {cn.linkedInvoiceNumber && <div className="text-[10px] text-blue-700 font-bold mt-1">Ref: {cn.linkedInvoiceNumber}</div>}
                </td>
                <td className="px-4 py-2 text-right whitespace-nowrap">
                  {cn.status !== "Reversed" && (linkingId === cn.id ? (
                    <div className="flex gap-1 items-center justify-end">
                      <input className="text-xs border border-slate-300 px-1.5 py-1 w-24" placeholder="Invoice #" value={linkInvoiceNumber} onChange={(e) => setLinkInvoiceNumber(e.target.value)} />
                      <button className="text-xs font-bold text-blue-700 hover:underline" onClick={() => confirmLink(cn)}>Save</button>
                      <button className="text-xs font-bold text-slate-400 hover:underline" onClick={() => setLinkingId(null)}>×</button>
                    </div>
                  ) : (
                    <button className="text-xs font-bold text-blue-700 hover:underline" onClick={() => startLink(cn)}>Link to Invoice</button>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------- Payments ---------------- */

function Payments({ customers, payments, promises, savePayment }) {
  const [form, setForm] = useState({ customerId: customers[0]?.id || "", date: todayISO(), amount: "", method: "Cash", note: "", promiseId: "" });
  const sorted = [...payments].sort((a, b) => new Date(b.date) - new Date(a.date));

  // Feature 7 — promises for the selected customer that still have a
  // remaining amount, so staff can apply this payment against one.
  const customerPromises = (promises || [])
    .filter((p) => p.customerId === form.customerId && p.status !== "Deleted")
    .map(promiseWithComputed)
    .filter((p) => p.remainingAmount > 0 && p.status !== "Cancelled");

  function submit() {
    if (!form.customerId || !Number(form.amount)) { alert("Customer aur amount zaroori hai."); return; }
    const customer = customers.find((c) => c.id === form.customerId);
    savePayment({
      id: uid("pay"), ...form, amount: Number(form.amount), customerName: customer.name,
      promiseId: form.promiseId || "",
      note: form.promiseId ? `Payment against Promise ${customerPromises.find((p) => p.id === form.promiseId)?.code || ""}${form.note ? " — " + form.note : ""}` : form.note,
    });
    setForm({ ...form, amount: "", note: "", promiseId: "" });
  }

  return (
    <div>
      <h2 className="text-xl font-black uppercase tracking-tight mb-4">Payments</h2>
      <div className="bg-white border border-slate-200 p-4 mb-6 max-w-xl">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Customer">
            <select className={inputCls} value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value, promiseId: "" })}>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Date">
            <input type="date" className={inputCls} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Amount (Rs)">
            <input type="number" className={inputCls} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          </Field>
          <Field label="Method">
            <select className={inputCls} value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
              <option>Cash</option><option>Bank Transfer</option><option>Cheque</option><option>Easypaisa/JazzCash</option>
            </select>
          </Field>
        </div>
        {customerPromises.length > 0 && (
          <Field label="Apply Against Promise (optional)">
            <select className={inputCls} value={form.promiseId} onChange={(e) => setForm({ ...form, promiseId: e.target.value })}>
              <option value="">None — general payment</option>
              {customerPromises.map((p) => (
                <option key={p.id} value={p.id}>{p.code} — Remaining {fmtMoney(p.remainingAmount)} (Due {fmtDate(p.expectedDate)})</option>
              ))}
            </select>
          </Field>
        )}
        <Field label="Note">
          <input className={inputCls} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
        </Field>
        <Btn onClick={submit}>Record Payment</Btn>
      </div>
      <div className="bg-white border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-slate-200">
            <th className="px-4 py-2">Date</th><th className="px-4 py-2">Customer</th><th className="px-4 py-2">Method</th><th className="px-4 py-2 text-right">Amount</th><th className="px-4 py-2">Note</th>
          </tr></thead>
          <tbody>
            {sorted.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">Koi payment record nahi.</td></tr>}
            {sorted.map((p) => (
              <tr key={p.id} className="border-t border-slate-100">
                <td className="px-4 py-2">{fmtDate(p.date)}</td>
                <td className="px-4 py-2 font-bold">{p.customerName}</td>
                <td className="px-4 py-2 text-slate-500">{p.method}</td>
                <td className="px-4 py-2 text-right font-bold text-emerald-600">{fmtMoney(p.amount)}</td>
                <td className="px-4 py-2 text-slate-500 text-xs">{p.note || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------- Outstanding Transfer ---------------- */

function OutstandingTransferPage({ customers, invoices, payments, returns, exchanges, promises, transfers, adjustments, currentUser, onCreateTransfer, onReverseTransfer }) {
  const [showForm, setShowForm] = useState(false);
  const [fromCustomerId, setFromCustomerId] = useState("");
  const [toCustomerId, setToCustomerId] = useState("");
  const [fromSearch, setFromSearch] = useState("");
  const [toSearch, setToSearch] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [reversing, setReversing] = useState(null);
  const [reverseReason, setReverseReason] = useState("");

  const fromCustomer = customers.find((c) => c.id === fromCustomerId);
  const toCustomer = customers.find((c) => c.id === toCustomerId);

  const fromOutstanding = fromCustomer
    ? computeLedgerForCustomer(fromCustomer, invoices, payments, returns, exchanges, promises, transfers, adjustments).outstanding
    : 0;
  const toOutstanding = toCustomer
    ? computeLedgerForCustomer(toCustomer, invoices, payments, returns, exchanges, promises, transfers, adjustments).outstanding
    : 0;

  const amtNum = Number(amount) || 0;
  const fromAfter = fromOutstanding - amtNum;
  const toAfter = toOutstanding + amtNum;

  const filteredFrom = customers.filter((c) => c.name.toLowerCase().includes(fromSearch.toLowerCase()));
  const filteredTo = customers.filter((c) => c.name.toLowerCase().includes(toSearch.toLowerCase()) && c.id !== fromCustomerId);

  function resetForm() {
    setFromCustomerId(""); setToCustomerId(""); setFromSearch(""); setToSearch(""); setAmount(""); setReason("");
  }

  function submit() {
    if (!fromCustomerId || !toCustomerId) { alert("From aur To Customer select karein."); return; }
    if (fromCustomerId === toCustomerId) { alert("From aur To Customer same nahi ho sakte."); return; }
    if (!amtNum || amtNum <= 0) { alert("Transfer amount 0 se zyada hona chahiye."); return; }
    if (amtNum > fromOutstanding) { alert("Transfer amount From Customer ke current outstanding se zyada nahi ho sakta."); return; }
    if (!reason.trim()) { alert("Reason likhna zaroori hai."); return; }
    if (!confirm(`Rs. ${amtNum.toLocaleString()} outstanding ${fromCustomer.name} se ${toCustomer.name} ke khate mein transfer karna hai. Continue?`)) return;
    onCreateTransfer({
      fromCustomerId, fromCustomerName: fromCustomer.name,
      toCustomerId, toCustomerName: toCustomer.name,
      amount: amtNum, reason: reason.trim(),
    });
    resetForm();
    setShowForm(false);
  }

  function confirmReverse() {
    if (!reverseReason.trim()) { alert("Reverse ki wajah likhein."); return; }
    onReverseTransfer(reversing, reverseReason.trim());
    setReversing(null); setReverseReason("");
  }

  const sorted = [...transfers].sort((a, b) => new Date(b.date) - new Date(a.date));
  const canReverse = currentUser?.role === "admin";

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-black uppercase tracking-tight">Outstanding Transfer</h2>
        <Btn onClick={() => setShowForm(true)} disabled={customers.length < 2}>+ New Outstanding Transfer</Btn>
      </div>
      <div className="text-xs text-slate-400 mb-4 max-w-2xl">
        Ek customer ka outstanding balance doosre customer ke khate mein move karein. Ye payment receive nahi hai aur cash transaction nahi hai — sirf udhaar/outstanding balance ek account se doosre account mein move hota hai.
      </div>

      <div className="bg-white border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-slate-200">
              <th className="px-4 py-2">Transfer #</th><th className="px-4 py-2">Date</th><th className="px-4 py-2">From Customer</th>
              <th className="px-4 py-2">To Customer</th><th className="px-4 py-2 text-right">Amount</th><th className="px-4 py-2">Reason</th>
              <th className="px-4 py-2">Created By</th><th className="px-4 py-2">Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && <tr><td colSpan={9} className="px-4 py-6 text-center text-slate-400">Koi outstanding transfer nahi hua abhi tak.</td></tr>}
            {sorted.map((t) => (
              <tr key={t.id} className={`border-t border-slate-100 ${t.status === "Reversed" ? "opacity-50" : ""}`}>
                <td className="px-4 py-2 font-black text-blue-700">{t.code}</td>
                <td className="px-4 py-2 text-slate-500">{fmtDate(t.date)}</td>
                <td className="px-4 py-2 font-bold">{t.fromCustomerName}</td>
                <td className="px-4 py-2 font-bold">{t.toCustomerName}</td>
                <td className="px-4 py-2 text-right font-bold">{fmtMoney(t.amount)}</td>
                <td className="px-4 py-2 text-slate-500 text-xs">{t.reason}</td>
                <td className="px-4 py-2 text-slate-500">{t.createdBy}</td>
                <td className="px-4 py-2">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 ${TRANSFER_STATUS_TONE[t.status] || "bg-slate-100 text-slate-500"}`}>{t.status}</span>
                  {t.status === "Reversed" && t.reverseReason && (
                    <div className="text-[10px] text-slate-400 mt-1">Reason: {t.reverseReason}</div>
                  )}
                </td>
                <td className="px-4 py-2 text-right whitespace-nowrap">
                  {t.status !== "Reversed" && canReverse && (
                    <button className="text-xs font-bold text-slate-500 hover:text-red-600" onClick={() => setReversing(t)}>Reverse</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <Modal title="New Outstanding Transfer" onClose={() => { setShowForm(false); resetForm(); }}>
          <Field label="From Customer">
            <input className={`${inputCls} mb-1`} placeholder="Search customer..." value={fromSearch} onChange={(e) => setFromSearch(e.target.value)} />
            <select className={inputCls} value={fromCustomerId} onChange={(e) => { setFromCustomerId(e.target.value); if (e.target.value === toCustomerId) setToCustomerId(""); }}>
              <option value="">Select Customer</option>
              {filteredFrom.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          {fromCustomer && (
            <div className="text-xs text-slate-500 mb-3">
              Current Outstanding: <span className={`font-black ${fromOutstanding > 0 ? "text-red-600" : "text-emerald-600"}`}>{fmtMoney(fromOutstanding)}</span>
            </div>
          )}

          <Field label="To Customer">
            <input className={`${inputCls} mb-1`} placeholder="Search customer..." value={toSearch} onChange={(e) => setToSearch(e.target.value)} />
            <select className={inputCls} value={toCustomerId} onChange={(e) => setToCustomerId(e.target.value)}>
              <option value="">Select Customer</option>
              {filteredTo.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          {toCustomer && (
            <div className="text-xs text-slate-500 mb-3">
              Current Outstanding: <span className={`font-black ${toOutstanding > 0 ? "text-red-600" : "text-emerald-600"}`}>{fmtMoney(toOutstanding)}</span>
            </div>
          )}

          <Field label="Transfer Amount (Rs)">
            <input type="number" className={inputCls} value={amount} onChange={(e) => setAmount(e.target.value)} />
          </Field>
          <Field label="Reason / Note">
            <input className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Customer A ki request par amount Customer B ke khate mein transfer kiya gaya." />
          </Field>

          {fromCustomer && toCustomer && (
            <div className="bg-slate-50 border border-slate-200 p-3 mt-2 text-sm space-y-1">
              <div className="font-black uppercase text-[11px] text-slate-500 mb-1">Balance Preview</div>
              <div className="flex justify-between"><span>{fromCustomer.name} — Before</span><span className="font-bold">{fmtMoney(fromOutstanding)}</span></div>
              <div className="flex justify-between"><span>{fromCustomer.name} — After</span><span className="font-black text-red-600">{fmtMoney(fromAfter)}</span></div>
              <div className="flex justify-between border-t border-slate-300 pt-1"><span>{toCustomer.name} — Before</span><span className="font-bold">{fmtMoney(toOutstanding)}</span></div>
              <div className="flex justify-between"><span>{toCustomer.name} — After</span><span className="font-black text-red-600">{fmtMoney(toAfter)}</span></div>
            </div>
          )}

          <div className="flex gap-2 mt-4">
            <Btn onClick={submit}>Transfer Outstanding</Btn>
            <Btn variant="ghost" onClick={() => { setShowForm(false); resetForm(); }}>Cancel</Btn>
          </div>
        </Modal>
      )}

      {reversing && (
        <Modal title={`Reverse Transfer ${reversing.code}`} onClose={() => setReversing(null)}>
          <div className="text-sm text-slate-600 mb-3">
            Ye transfer reverse karne se <span className="font-bold">{reversing.fromCustomerName}</span> ka outstanding {fmtMoney(reversing.amount)} dobara increase ho jayega aur <span className="font-bold">{reversing.toCustomerName}</span> ka outstanding {fmtMoney(reversing.amount)} decrease ho jayega.
          </div>
          <Field label="Reverse Reason">
            <input className={inputCls} value={reverseReason} onChange={(e) => setReverseReason(e.target.value)} autoFocus />
          </Field>
          <div className="flex gap-2">
            <Btn variant="danger" onClick={confirmReverse}>Confirm Reverse</Btn>
            <Btn variant="ghost" onClick={() => setReversing(null)}>Cancel</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ---------------- Adjustment ---------------- */

// Reusable form used both from the per-customer Ledger view ("+ Adjustment"
// button) and from the standalone Adjustments page. `initial` (when set)
// puts the form in edit mode for an existing Active adjustment.
function AdjustmentForm({ customers, defaultCustomerId, invoices, payments, returns, exchanges, promises, transfers, adjustments, initial, currentUser, onSave, onCancel }) {
  const [customerId, setCustomerId] = useState(initial?.customerId || defaultCustomerId || customers[0]?.id || "");
  const [custSearch, setCustSearch] = useState("");
  const [type, setType] = useState(initial?.type || "Add");
  const [amount, setAmount] = useState(initial?.amount ?? "");
  const [category, setCategory] = useState(initial?.category || ADJUSTMENT_CATEGORIES[0]);
  const [reason, setReason] = useState(initial?.reason || "");
  const [note, setNote] = useState(initial?.note || "");
  const [date, setDate] = useState(initial?.date || todayISO());
  const [error, setError] = useState("");

  const customer = customers.find((c) => c.id === customerId);
  // Current balance BEFORE this adjustment: when editing, the active
  // adjustment is excluded from the ledger calc so the preview reflects
  // "balance without this adjustment", then the new amount is applied on
  // top — this is what makes edit safely reverse-then-reapply.
  const otherAdjustments = (adjustments || []).filter((a) => a.id !== initial?.id);
  const currentBalance = customer
    ? computeLedgerForCustomer(customer, invoices, payments, returns, exchanges, promises, transfers, otherAdjustments).outstanding
    : 0;
  const amtNum = Number(amount) || 0;
  const newBalance = type === "Add" ? currentBalance + amtNum : currentBalance - amtNum;

  const filteredCustomers = customers.filter((c) => c.name.toLowerCase().includes(custSearch.toLowerCase()));
  const isEdit = !!initial;

  function submit() {
    if (!customerId) { setError("Customer select karein."); return; }
    if (!amtNum || amtNum <= 0) { setError("Amount 0 se zyada hona chahiye."); return; }
    if (!reason.trim()) { setError("Reason likhna zaroori hai."); return; }
    const cust = customers.find((c) => c.id === customerId);
    setError("");
    onSave({
      customerId, customerName: cust.name, type, amount: amtNum, category,
      reason: reason.trim(), note: note.trim(), date,
    });
  }

  return (
    <div>
      {!isEdit && (
        <Field label="Customer">
          <input className={`${inputCls} mb-1`} placeholder="Search customer..." value={custSearch} onChange={(e) => setCustSearch(e.target.value)} />
          <select className={inputCls} value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
            <option value="">Select Customer</option>
            {filteredCustomers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
      )}
      {isEdit && (
        <div className="text-sm font-bold text-slate-700 bg-slate-50 border border-slate-200 px-3 py-2 mb-3">{customer?.name}</div>
      )}
      {customer && (
        <div className="text-xs text-slate-500 mb-3">
          Current Balance: <span className={`font-black ${currentBalance > 0 ? "text-red-600" : "text-emerald-600"}`}>{fmtMoney(currentBalance)}</span>
        </div>
      )}

      <Field label="Adjustment Type">
        <div className="flex gap-2">
          <button type="button" onClick={() => setType("Add")} className={`flex-1 px-3 py-2 text-sm font-bold uppercase tracking-wide border ${type === "Add" ? "bg-red-600 text-white border-red-600" : "bg-white text-slate-600 border-slate-300"}`}>Add Balance (+)</button>
          <button type="button" onClick={() => setType("Reduce")} className={`flex-1 px-3 py-2 text-sm font-bold uppercase tracking-wide border ${type === "Reduce" ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-600 border-slate-300"}`}>Reduce Balance (-)</button>
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Amount (Rs)">
          <input type="number" className={inputCls} value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
        <Field label="Category">
          <select className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)}>
            {ADJUSTMENT_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>
      </div>

      <Field label="Reason">
        <input className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Customer ke liye transport service" />
      </Field>
      <Field label="Note (optional)">
        <input className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Delivery charges adjustment" />
      </Field>
      <Field label="Date">
        <input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} />
      </Field>

      {customer && (
        <div className="bg-slate-50 border border-slate-200 p-3 mt-2 text-sm space-y-1">
          <div className="flex justify-between"><span>Current Balance</span><span className="font-bold">{fmtMoney(currentBalance)}</span></div>
          <div className="flex justify-between"><span>Adjustment</span><span className={`font-bold ${type === "Add" ? "text-red-600" : "text-emerald-600"}`}>{type === "Add" ? "+" : "-"}{fmtMoney(amtNum)}</span></div>
          <div className="flex justify-between border-t border-slate-300 pt-1"><span className="font-bold">New Balance</span><span className={`font-black ${newBalance > 0 ? "text-red-600" : "text-emerald-600"}`}>{fmtMoney(newBalance)}</span></div>
        </div>
      )}

      {error && <div className="text-red-600 text-sm font-semibold mt-3">{error}</div>}
      <div className="flex gap-2 mt-4">
        <Btn onClick={submit}>{isEdit ? "Save Changes" : "Save Adjustment"}</Btn>
        <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
      </div>
    </div>
  );
}

function AdjustmentsPage({ customers, invoices, payments, returns, exchanges, promises, transfers, adjustments, currentUser, onCreateAdjustment, onUpdateAdjustment, onReverseAdjustment }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [reversing, setReversing] = useState(null);
  const [reverseReason, setReverseReason] = useState("");
  const [q, setQ] = useState("");

  const canManage = currentUser?.role === "admin";

  const sorted = [...adjustments]
    .filter((a) => !q.trim() || a.customerName.toLowerCase().includes(q.toLowerCase()) || a.code.toLowerCase().includes(q.toLowerCase()) || a.category.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  function confirmReverse() {
    if (!reverseReason.trim()) { alert("Reverse ki wajah likhein."); return; }
    onReverseAdjustment(reversing, reverseReason.trim());
    setReversing(null); setReverseReason("");
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-black uppercase tracking-tight">Adjustments</h2>
        <Btn onClick={() => { setEditing(null); setShowForm(true); }} disabled={customers.length === 0}>+ Adjustment</Btn>
      </div>
      <div className="text-xs text-slate-400 mb-4 max-w-2xl">
        Kisi customer ke balance ko manually increase ya decrease karein — bina fake invoice ya fake payment ke. Transport, labour, repair, discount, compensation ya balance correction jaisi real business situations ke liye.
      </div>

      <input className={`${inputCls} mb-3 max-w-xs`} placeholder="Search customer / adj # / category..." value={q} onChange={(e) => setQ(e.target.value)} />

      <div className="bg-white border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-slate-200">
              <th className="px-4 py-2">Adj #</th><th className="px-4 py-2">Date</th><th className="px-4 py-2">Customer</th>
              <th className="px-4 py-2">Type</th><th className="px-4 py-2">Category</th><th className="px-4 py-2 text-right">Amount</th>
              <th className="px-4 py-2">Reason</th><th className="px-4 py-2">Created By</th><th className="px-4 py-2">Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && <tr><td colSpan={10} className="px-4 py-6 text-center text-slate-400">Koi adjustment nahi hua abhi tak.</td></tr>}
            {sorted.map((a) => (
              <tr key={a.id} className={`border-t border-slate-100 ${a.status === "Reversed" ? "opacity-50" : ""}`}>
                <td className="px-4 py-2 font-black text-blue-700">{a.code}</td>
                <td className="px-4 py-2 text-slate-500">{fmtDate(a.date)}</td>
                <td className="px-4 py-2 font-bold">{a.customerName}</td>
                <td className="px-4 py-2">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 ${a.type === "Add" ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
                    {a.type === "Add" ? "Add (+)" : "Reduce (-)"}
                  </span>
                </td>
                <td className="px-4 py-2 text-slate-500">{a.category}</td>
                <td className={`px-4 py-2 text-right font-bold ${a.type === "Add" ? "text-red-600" : "text-emerald-600"}`}>{a.type === "Add" ? "+" : "-"}{fmtMoney(a.amount)}</td>
                <td className="px-4 py-2 text-slate-500 text-xs">{a.reason}{a.note ? <div className="text-slate-400">{a.note}</div> : null}</td>
                <td className="px-4 py-2 text-slate-500">{a.createdBy}</td>
                <td className="px-4 py-2">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 ${ADJUSTMENT_STATUS_TONE[a.status] || "bg-slate-100 text-slate-500"}`}>{a.status}</span>
                  {a.status === "Reversed" && a.reverseReason && (
                    <div className="text-[10px] text-slate-400 mt-1">Reason: {a.reverseReason}</div>
                  )}
                </td>
                <td className="px-4 py-2 text-right whitespace-nowrap space-x-2">
                  {a.status !== "Reversed" && canManage && (
                    <>
                      <button className="text-xs font-bold text-slate-500 hover:text-blue-700" onClick={() => { setEditing(a); setShowForm(true); }}>Edit</button>
                      <button className="text-xs font-bold text-slate-500 hover:text-red-600" onClick={() => setReversing(a)}>Reverse</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <Modal title={editing ? `Edit Adjustment ${editing.code}` : "New Adjustment"} onClose={() => { setShowForm(false); setEditing(null); }}>
          <AdjustmentForm
            customers={customers}
            invoices={invoices}
            payments={payments}
            returns={returns}
            exchanges={exchanges}
            promises={promises}
            transfers={transfers}
            adjustments={adjustments}
            initial={editing}
            currentUser={currentUser}
            onCancel={() => { setShowForm(false); setEditing(null); }}
            onSave={(data) => {
              if (editing) onUpdateAdjustment(editing, data);
              else onCreateAdjustment(data);
              setShowForm(false); setEditing(null);
            }}
          />
        </Modal>
      )}

      {reversing && (
        <Modal title={`Reverse Adjustment ${reversing.code}`} onClose={() => setReversing(null)}>
          <div className="text-sm text-slate-600 mb-3">
            Ye adjustment reverse karne se <span className="font-bold">{reversing.customerName}</span> ka balance is adjustment se pehle wali state mein wapis chala jayega. Original adjustment aur ye reversal dono history mein visible rahenge.
          </div>
          <Field label="Reverse Reason">
            <input className={inputCls} value={reverseReason} onChange={(e) => setReverseReason(e.target.value)} autoFocus />
          </Field>
          <div className="flex gap-2">
            <Btn variant="danger" onClick={confirmReverse}>Confirm Reverse</Btn>
            <Btn variant="ghost" onClick={() => setReversing(null)}>Cancel</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ==================== Commission Management System ====================
   Integrates with the existing Invoice / Customer / Payment systems:
   - Reads invoices (never rewrites invoice.total or invoice calculations).
   - Reuses the existing Field/Btn/Modal/Stat/table UI patterns.
   - Persists through the same storeGet/storeSet + Supabase/localStorage
     layer as every other module (see commissionAgents/commissionRules/
     commissionTransactions/commissionPayments in the App component).
   - Uses the existing t()/tStatus() bilingual system for all labels.
   ========================================================================= */

function CommissionAgentForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(
    initial || {
      name: "", phone: "", whatsapp: "", address: "",
      defaultCommissionType: "percentage", defaultCommissionRate: "",
      status: "Active", notes: "",
    }
  );
  const [error, setError] = useState("");

  function submit() {
    if (!form.name.trim()) { setError("Agent ka naam zaroori hai."); return; }
    setError("");
    onSave({ ...form, defaultCommissionRate: Number(form.defaultCommissionRate) || 0 });
  }

  return (
    <div>
      <Field label="Agent Name">
        <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Phone">
          <input className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </Field>
        <Field label="WhatsApp">
          <input className={inputCls} value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
        </Field>
      </div>
      <Field label="Address">
        <input className={inputCls} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
      </Field>
      <div className="text-[11px] text-slate-400 mb-2">Default Commission is used only when no specific Commission Rule matches an invoice for this agent (see Commission Rules for per-product overrides).</div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Commission Type">
          <select className={inputCls} value={form.defaultCommissionType} onChange={(e) => setForm({ ...form, defaultCommissionType: e.target.value })}>
            {COMMISSION_TYPES.map((ct) => <option key={ct} value={ct}>{t(COMMISSION_TYPE_LABELS[ct])}</option>)}
          </select>
        </Field>
        <Field label="Commission Rate">
          <input type="number" step="any" className={inputCls} value={form.defaultCommissionRate} onChange={(e) => setForm({ ...form, defaultCommissionRate: e.target.value })} />
        </Field>
      </div>
      <Field label="Status">
        <div className="flex gap-2">
          <button type="button" onClick={() => setForm({ ...form, status: "Active" })} className={`flex-1 px-3 py-2 text-sm font-bold uppercase tracking-wide border ${form.status === "Active" ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-600 border-slate-300"}`}>{t("Active")}</button>
          <button type="button" onClick={() => setForm({ ...form, status: "Inactive" })} className={`flex-1 px-3 py-2 text-sm font-bold uppercase tracking-wide border ${form.status === "Inactive" ? "bg-slate-600 text-white border-slate-600" : "bg-white text-slate-600 border-slate-300"}`}>{t("Inactive")}</button>
        </div>
      </Field>
      <Field label="Notes">
        <input className={inputCls} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      </Field>
      {error && <div className="text-red-600 text-sm font-semibold mb-3">{error}</div>}
      <div className="flex gap-2 mt-2">
        <Btn onClick={submit}>Save Agent</Btn>
        <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
      </div>
    </div>
  );
}

function CommissionAgentLedgerView({ agent, transactions, payments, onClose, onPay, onApprove, canManage }) {
  const summary = computeCommissionSummaryForAgent(agent.id, transactions, payments);
  const myPayments = (payments || []).filter((p) => p.agentId === agent.id).sort((a, b) => new Date(b.date) - new Date(a.date));
  const rows = [...summary.transactions].sort((a, b) => new Date(a.invoiceDate) - new Date(b.invoiceDate));

  return (
    <Modal title={`Commission Ledger — ${agent.name}`} onClose={onClose} wide>
      <div className="flex flex-wrap gap-3 mb-4">
        <Stat label="Total Commission" value={fmtMoney(summary.totalCommission)} />
        <Stat label="Paid Commission" value={fmtMoney(summary.totalPaid)} accent="text-emerald-600" />
        <Stat label="Outstanding Commission" value={fmtMoney(summary.remaining)} accent="text-red-600" />
      </div>
      <div className="bg-white border border-slate-200 overflow-x-auto mb-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-slate-200">
              <th className="px-3 py-2">Date</th><th className="px-3 py-2">Invoice Number</th><th className="px-3 py-2">Customer</th>
              <th className="px-3 py-2 text-right">Sale Amount</th><th className="px-3 py-2">Commission Rate</th>
              <th className="px-3 py-2 text-right">Commission Amount</th><th className="px-3 py-2 text-right">Paid Commission</th>
              <th className="px-3 py-2 text-right">Remaining</th><th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={9} className="px-3 py-6 text-center text-slate-400">Koi record nahi.</td></tr>}
            {rows.map((tx) => (
              <tr key={tx.id} className="border-t border-slate-100">
                <td className="px-3 py-2 text-slate-500">{fmtDate(tx.invoiceDate)}</td>
                <td className="px-3 py-2 font-bold text-blue-700">{tx.invoiceNumber}</td>
                <td className="px-3 py-2">{tx.customerName}</td>
                <td className="px-3 py-2 text-right">{fmtMoney(tx.saleAmount)}</td>
                <td className="px-3 py-2 text-slate-500">{fmtCommissionRate(tx.commissionType, tx.commissionRate)}</td>
                <td className="px-3 py-2 text-right font-bold">{fmtMoney(tx.commissionAmount)}</td>
                <td className="px-3 py-2 text-right text-emerald-600 font-bold">{fmtMoney(tx.paidAmount)}</td>
                <td className="px-3 py-2 text-right text-red-600 font-bold">{fmtMoney(tx.remainingAmount)}</td>
                <td className="px-3 py-2">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 ${COMMISSION_STATUS_TONE[tx.status] || "bg-slate-100 text-slate-500"}`}>{tStatus(tx.status)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-white border border-slate-200 overflow-x-auto mb-4">
        <div className="px-3 py-2 border-b border-slate-200 font-black uppercase text-xs tracking-wide text-slate-500">Commission Payment History</div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-slate-200">
              <th className="px-3 py-2">Date</th><th className="px-3 py-2">Method</th><th className="px-3 py-2">Reference</th>
              <th className="px-3 py-2 text-right">Amount</th><th className="px-3 py-2">Notes</th>
            </tr>
          </thead>
          <tbody>
            {myPayments.length === 0 && <tr><td colSpan={5} className="px-3 py-6 text-center text-slate-400">Koi payment nahi.</td></tr>}
            {myPayments.map((p) => (
              <tr key={p.id} className="border-t border-slate-100">
                <td className="px-3 py-2 text-slate-500">{fmtDate(p.date)}</td>
                <td className="px-3 py-2">{p.method}</td>
                <td className="px-3 py-2 text-slate-500">{p.referenceNumber || "-"}</td>
                <td className="px-3 py-2 text-right font-bold text-emerald-600">{fmtMoney(p.amount)}</td>
                <td className="px-3 py-2 text-slate-500 text-xs">{p.notes || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {canManage && (
        <div className="flex gap-2">
          <Btn onClick={onPay} disabled={summary.remaining <= 0}>Pay Commission</Btn>
          <Btn variant="ghost" onClick={onClose}>Close</Btn>
        </div>
      )}
    </Modal>
  );
}

function CommissionAgentsPage({ agents, transactions, payments, currentUser, onCreateAgent, onUpdateAgent, onToggleAgentStatus, onOpenPay }) {
  const [modal, setModal] = useState(null); // null | 'new' | agent
  const [ledgerAgent, setLedgerAgent] = useState(null);
  const [q, setQ] = useState("");
  const canManage = currentUser?.role === "admin";

  const rows = agents
    .filter((a) => !q.trim() || a.name.toLowerCase().includes(q.toLowerCase()) || a.id.toLowerCase().includes(q.toLowerCase()))
    .map((a) => ({ ...a, summary: computeCommissionSummaryForAgent(a.id, transactions, payments) }));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-black uppercase tracking-tight">Commission Agents</h2>
        {canManage && <Btn onClick={() => setModal("new")}>+ New Agent</Btn>}
      </div>
      <input className={`${inputCls} mb-3 max-w-xs`} placeholder="Search agent name / ID..." value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="bg-white border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-slate-200">
              <th className="px-4 py-2">Agent ID</th><th className="px-4 py-2">Agent Name</th><th className="px-4 py-2">Phone</th>
              <th className="px-4 py-2">Default Commission</th>
              <th className="px-4 py-2 text-right">Total</th><th className="px-4 py-2 text-right">Paid</th><th className="px-4 py-2 text-right">Outstanding</th>
              <th className="px-4 py-2">Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={9} className="px-4 py-6 text-center text-slate-400">Koi commission agent nahi.</td></tr>}
            {rows.map((a) => (
              <tr key={a.id} className="border-t border-slate-100">
                <td className="px-4 py-2 font-black text-blue-700">{a.id}</td>
                <td className="px-4 py-2 font-bold cursor-pointer hover:text-blue-700" onClick={() => setLedgerAgent(a)}>{a.name}</td>
                <td className="px-4 py-2 text-slate-500">{a.phone || "-"}</td>
                <td className="px-4 py-2 text-slate-500">{fmtCommissionRate(a.defaultCommissionType, a.defaultCommissionRate)}</td>
                <td className="px-4 py-2 text-right font-bold">{fmtMoney(a.summary.totalCommission)}</td>
                <td className="px-4 py-2 text-right text-emerald-600 font-bold">{fmtMoney(a.summary.totalPaid)}</td>
                <td className="px-4 py-2 text-right text-red-600 font-bold">{fmtMoney(a.summary.remaining)}</td>
                <td className="px-4 py-2">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 ${a.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>{tStatus(a.status)}</span>
                </td>
                <td className="px-4 py-2 text-right whitespace-nowrap space-x-2">
                  <button className="text-xs font-bold text-slate-500 hover:text-blue-700" onClick={() => setLedgerAgent(a)}>Ledger</button>
                  {canManage && (
                    <>
                      <button className="text-xs font-bold text-slate-500 hover:text-blue-700" onClick={() => setModal(a)}>Edit</button>
                      <button className="text-xs font-bold text-slate-500 hover:text-red-600" onClick={() => onToggleAgentStatus(a)}>{a.status === "Active" ? "Deactivate" : "Activate"}</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal && (
        <Modal title={modal === "new" ? "New Agent" : `Edit Agent ${modal.id}`} onClose={() => setModal(null)}>
          <CommissionAgentForm
            initial={modal === "new" ? null : modal}
            onCancel={() => setModal(null)}
            onSave={(data) => { modal === "new" ? onCreateAgent(data) : onUpdateAgent(modal, data); setModal(null); }}
          />
        </Modal>
      )}
      {ledgerAgent && (
        <CommissionAgentLedgerView
          agent={ledgerAgent}
          transactions={transactions}
          payments={payments}
          canManage={canManage}
          onClose={() => setLedgerAgent(null)}
          onPay={() => { onOpenPay(ledgerAgent, null); }}
        />
      )}
    </div>
  );
}

function CommissionRuleForm({ agents, products, initial, onSave, onCancel }) {
  const [form, setForm] = useState(
    initial || {
      agentId: agents[0]?.id || "", productMatch: ALL_PRODUCTS_KEY,
      commissionType: "percentage", commissionRate: "",
      minSaleAmount: "", maxCommission: "", startDate: "", endDate: "", status: "Active",
    }
  );
  const [error, setError] = useState("");

  function submit() {
    if (!form.agentId) { setError("Agent select karein."); return; }
    if (!Number(form.commissionRate) || Number(form.commissionRate) <= 0) { setError("Commission Rate 0 se zyada hona chahiye."); return; }
    setError("");
    onSave({
      ...form,
      commissionRate: Number(form.commissionRate) || 0,
      minSaleAmount: Number(form.minSaleAmount) || 0,
      maxCommission: Number(form.maxCommission) || 0,
    });
  }

  return (
    <div>
      <Field label="Agent">
        <select className={inputCls} value={form.agentId} onChange={(e) => setForm({ ...form, agentId: e.target.value })}>
          {agents.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.id})</option>)}
        </select>
      </Field>
      <Field label="Product">
        <select className={inputCls} value={form.productMatch} onChange={(e) => setForm({ ...form, productMatch: e.target.value })}>
          <option value={ALL_PRODUCTS_KEY}>{t(ALL_PRODUCTS_KEY)}</option>
          {products.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Commission Type">
          <select className={inputCls} value={form.commissionType} onChange={(e) => setForm({ ...form, commissionType: e.target.value })}>
            {COMMISSION_TYPES.map((ct) => <option key={ct} value={ct}>{t(COMMISSION_TYPE_LABELS[ct])}</option>)}
          </select>
        </Field>
        <Field label="Commission Rate">
          <input type="number" step="any" className={inputCls} value={form.commissionRate} onChange={(e) => setForm({ ...form, commissionRate: e.target.value })} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Minimum Sale Amount">
          <input type="number" className={inputCls} value={form.minSaleAmount} onChange={(e) => setForm({ ...form, minSaleAmount: e.target.value })} />
        </Field>
        <Field label="Maximum Commission">
          <input type="number" className={inputCls} value={form.maxCommission} onChange={(e) => setForm({ ...form, maxCommission: e.target.value })} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Start Date">
          <input type="date" className={inputCls} value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
        </Field>
        <Field label="End Date">
          <input type="date" className={inputCls} value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
        </Field>
      </div>
      <Field label="Status">
        <div className="flex gap-2">
          <button type="button" onClick={() => setForm({ ...form, status: "Active" })} className={`flex-1 px-3 py-2 text-sm font-bold uppercase tracking-wide border ${form.status === "Active" ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-600 border-slate-300"}`}>{t("Active")}</button>
          <button type="button" onClick={() => setForm({ ...form, status: "Inactive" })} className={`flex-1 px-3 py-2 text-sm font-bold uppercase tracking-wide border ${form.status === "Inactive" ? "bg-slate-600 text-white border-slate-600" : "bg-white text-slate-600 border-slate-300"}`}>{t("Inactive")}</button>
        </div>
      </Field>
      {error && <div className="text-red-600 text-sm font-semibold mb-3">{error}</div>}
      <div className="flex gap-2 mt-2">
        <Btn onClick={submit}>Save Rule</Btn>
        <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
      </div>
    </div>
  );
}

function CommissionRulesPage({ agents, products, rules, currentUser, onCreateRule, onUpdateRule }) {
  const [modal, setModal] = useState(null);
  const canManage = currentUser?.role === "admin";
  const sorted = [...rules].sort((a, b) => (a.agentId || "").localeCompare(b.agentId || ""));

  function toggleStatus(rule) {
    onUpdateRule(rule, { ...rule, status: rule.status === "Active" ? "Inactive" : "Active" });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-black uppercase tracking-tight">Commission Rules</h2>
        {canManage && <Btn onClick={() => setModal("new")} disabled={agents.length === 0}>+ New Rule</Btn>}
      </div>
      <div className="text-xs text-slate-400 mb-4 max-w-2xl">
        Har agent ke liye product-specific ya all-products commission rule banayein. Jab invoice par wo agent select hoga, sabse specific active rule (product-match) automatically use hogi, warna agent ka default commission apply hoga.
      </div>
      {agents.length === 0 && <div className="text-slate-400 mb-3">Pehle Commission Agents tab mein agent add karein.</div>}
      <div className="bg-white border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-slate-200">
              <th className="px-4 py-2">Agent</th><th className="px-4 py-2">Product</th><th className="px-4 py-2">Type</th><th className="px-4 py-2">Rate</th>
              <th className="px-4 py-2 text-right">Min Sale</th><th className="px-4 py-2 text-right">Max Commission</th>
              <th className="px-4 py-2">Start</th><th className="px-4 py-2">End</th><th className="px-4 py-2">Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && <tr><td colSpan={10} className="px-4 py-6 text-center text-slate-400">Koi commission rule nahi.</td></tr>}
            {sorted.map((r) => {
              const agent = agents.find((a) => a.id === r.agentId);
              return (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="px-4 py-2 font-bold">{agent ? agent.name : r.agentId}</td>
                  <td className="px-4 py-2 text-slate-500">{r.productMatch === ALL_PRODUCTS_KEY ? t(ALL_PRODUCTS_KEY) : r.productMatch}</td>
                  <td className="px-4 py-2 text-slate-500">{t(COMMISSION_TYPE_LABELS[r.commissionType])}</td>
                  <td className="px-4 py-2 font-bold">{fmtCommissionRate(r.commissionType, r.commissionRate)}</td>
                  <td className="px-4 py-2 text-right text-slate-500">{r.minSaleAmount > 0 ? fmtMoney(r.minSaleAmount) : "-"}</td>
                  <td className="px-4 py-2 text-right text-slate-500">{r.maxCommission > 0 ? fmtMoney(r.maxCommission) : "-"}</td>
                  <td className="px-4 py-2 text-slate-500">{r.startDate ? fmtDate(r.startDate) : "-"}</td>
                  <td className="px-4 py-2 text-slate-500">{r.endDate ? fmtDate(r.endDate) : "-"}</td>
                  <td className="px-4 py-2">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 ${r.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>{tStatus(r.status)}</span>
                  </td>
                  <td className="px-4 py-2 text-right whitespace-nowrap space-x-2">
                    {canManage && (
                      <>
                        <button className="text-xs font-bold text-slate-500 hover:text-blue-700" onClick={() => setModal(r)}>Edit</button>
                        <button className="text-xs font-bold text-slate-500 hover:text-red-600" onClick={() => toggleStatus(r)}>{r.status === "Active" ? "Deactivate" : "Activate"}</button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {modal && (
        <Modal title={modal === "new" ? "New Commission Rule" : "Edit Commission Rule"} onClose={() => setModal(null)}>
          <CommissionRuleForm
            agents={agents}
            products={products}
            initial={modal === "new" ? null : modal}
            onCancel={() => setModal(null)}
            onSave={(data) => { modal === "new" ? onCreateRule(data) : onUpdateRule(modal, data); setModal(null); }}
          />
        </Modal>
      )}
    </div>
  );
}

// Pay Commission — used both from an agent's Ledger (general payment,
// FIFO-allocated across that agent's Approved transactions with a
// remaining balance) and from Commission History (scoped to ONE specific
// transaction, capped at that transaction's own remaining amount).
function CommissionPaymentForm({ agent, transaction, remainingTotal, onSave, onCancel }) {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayISO());
  const [method, setMethod] = useState("Cash");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const cap = transaction ? transaction.remainingAmount : remainingTotal;
  const already = transaction ? transaction.paidAmount : (remainingTotal != null ? undefined : 0);

  function submit() {
    const amt = Number(amount) || 0;
    if (amt <= 0) { setError("Payment amount 0 se zyada hona chahiye."); return; }
    if (amt > cap + 0.005) { setError(`Payment amount remaining commission (${fmtMoney(cap)}) se zyada nahi ho sakta.`); return; }
    setError("");
    onSave({ amount: amt, date, method, referenceNumber: referenceNumber.trim(), notes: notes.trim() });
  }

  return (
    <div>
      <div className="bg-slate-50 border border-slate-200 p-3 mb-3 text-sm space-y-1">
        <div className="flex justify-between"><span className="text-slate-500">Agent</span><span className="font-bold">{agent.name}</span></div>
        {transaction && (
          <div className="flex justify-between"><span className="text-slate-500">Invoice</span><span className="font-bold">{transaction.invoiceNumber}</span></div>
        )}
        <div className="flex justify-between"><span className="text-slate-500">Total Commission</span><span className="font-bold">{fmtMoney(transaction ? transaction.commissionAmount : (remainingTotal + (transaction ? transaction.paidAmount : 0)))}</span></div>
        <div className="flex justify-between"><span className="text-slate-500">Already Paid</span><span className="font-bold text-emerald-600">{fmtMoney(transaction ? transaction.paidAmount : 0)}</span></div>
        <div className="flex justify-between border-t border-slate-300 pt-1"><span className="font-bold">Remaining Commission</span><span className="font-black text-red-600">{fmtMoney(cap)}</span></div>
      </div>
      <Field label="Payment Amount">
        <input type="number" className={inputCls} value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Payment Date">
          <input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Payment Method">
          <select className={inputCls} value={method} onChange={(e) => setMethod(e.target.value)}>
            {COMMISSION_PAYMENT_METHODS.map((m) => <option key={m} value={m}>{t(m)}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Reference Number">
        <input className={inputCls} value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} />
      </Field>
      <Field label="Notes">
        <input className={inputCls} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>
      {error && <div className="text-red-600 text-sm font-semibold mb-3">{error}</div>}
      <div className="flex gap-2">
        <Btn onClick={submit}>Pay Commission</Btn>
        <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
      </div>
    </div>
  );
}

function CommissionHistoryPage({ agents, transactions, invoices, currentUser, onView, onApprove, onOpenPay, onCancel }) {
  const [q, setQ] = useState("");
  const [agentFilter, setAgentFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [cancelling, setCancelling] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const canManage = currentUser?.role === "admin";

  const filtered = transactions.filter((tx) => {
    const matchesQ = !q.trim() ||
      tx.invoiceNumber.toLowerCase().includes(q.toLowerCase()) ||
      tx.customerName.toLowerCase().includes(q.toLowerCase()) ||
      tx.agentName.toLowerCase().includes(q.toLowerCase());
    const matchesAgent = agentFilter === "All" || tx.agentId === agentFilter;
    const matchesStatus = statusFilter === "All" || tx.status === statusFilter;
    const matchesFrom = !from || tx.invoiceDate >= from;
    const matchesTo = !to || tx.invoiceDate <= to;
    return matchesQ && matchesAgent && matchesStatus && matchesFrom && matchesTo;
  }).sort((a, b) => new Date(b.invoiceDate) - new Date(a.invoiceDate));

  function confirmCancel() {
    if (!cancelReason.trim()) { alert("Cancel ki wajah likhein."); return; }
    onCancel(cancelling, cancelReason.trim());
    setCancelling(null); setCancelReason("");
  }

  return (
    <div>
      <h2 className="text-xl font-black uppercase tracking-tight mb-2">Commission History</h2>
      <div className="flex flex-wrap gap-2 mb-3">
        <input className={`${inputCls} max-w-xs`} placeholder="Search invoice / customer / agent..." value={q} onChange={(e) => setQ(e.target.value)} />
        <select className={`${inputCls} max-w-[180px]`} value={agentFilter} onChange={(e) => setAgentFilter(e.target.value)}>
          <option value="All">All Agents</option>
          {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <select className={`${inputCls} max-w-[160px]`} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="All">All Status</option>
          {COMMISSION_STATUSES.map((s) => <option key={s} value={s}>{tStatus(s)}</option>)}
        </select>
        <input type="date" className={`${inputCls} max-w-[160px]`} value={from} onChange={(e) => setFrom(e.target.value)} />
        <input type="date" className={`${inputCls} max-w-[160px]`} value={to} onChange={(e) => setTo(e.target.value)} />
      </div>
      <div className="bg-white border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-slate-200">
              <th className="px-4 py-2">Date</th><th className="px-4 py-2">Invoice</th><th className="px-4 py-2">Customer</th><th className="px-4 py-2">Agent</th>
              <th className="px-4 py-2 text-right">Sale Amount</th><th className="px-4 py-2 text-right">Commission</th>
              <th className="px-4 py-2 text-right">Paid</th><th className="px-4 py-2 text-right">Remaining</th>
              <th className="px-4 py-2">Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={10} className="px-4 py-6 text-center text-slate-400">Koi commission transaction nahi.</td></tr>}
            {filtered.map((tx) => (
              <tr key={tx.id} className={`border-t border-slate-100 ${tx.status === "Cancelled" ? "opacity-50" : ""}`}>
                <td className="px-4 py-2 text-slate-500">{fmtDate(tx.invoiceDate)}</td>
                <td className="px-4 py-2 font-bold text-blue-700 cursor-pointer hover:underline" onClick={() => onView(tx)}>{tx.invoiceNumber}</td>
                <td className="px-4 py-2">{tx.customerName}</td>
                <td className="px-4 py-2">{tx.agentName}</td>
                <td className="px-4 py-2 text-right">{fmtMoney(tx.saleAmount)}</td>
                <td className="px-4 py-2 text-right font-bold">{fmtMoney(tx.commissionAmount)}</td>
                <td className="px-4 py-2 text-right text-emerald-600 font-bold">{fmtMoney(tx.paidAmount)}</td>
                <td className="px-4 py-2 text-right text-red-600 font-bold">{fmtMoney(tx.remainingAmount)}</td>
                <td className="px-4 py-2">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 ${COMMISSION_STATUS_TONE[tx.status] || "bg-slate-100 text-slate-500"}`}>{tStatus(tx.status)}</span>
                </td>
                <td className="px-4 py-2 text-right whitespace-nowrap space-x-2">
                  <button className="text-xs font-bold text-slate-500 hover:text-blue-700" onClick={() => onView(tx)}>View</button>
                  {canManage && tx.status === "Pending" && (
                    <button className="text-xs font-bold text-slate-500 hover:text-emerald-600" onClick={() => onApprove(tx)}>Approve</button>
                  )}
                  {canManage && tx.status === "Approved" && tx.remainingAmount > 0 && (
                    <button className="text-xs font-bold text-slate-500 hover:text-emerald-600" onClick={() => onOpenPay(null, tx)}>Pay</button>
                  )}
                  {canManage && (tx.status === "Pending" || tx.status === "Approved") && (
                    <button className="text-xs font-bold text-slate-500 hover:text-red-600" onClick={() => setCancelling(tx)}>Cancel</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {cancelling && (
        <Modal title={`Cancel Commission — ${cancelling.invoiceNumber}`} onClose={() => setCancelling(null)}>
          <div className="text-sm text-slate-600 mb-3">Ye commission cancel karne se ye payable nahi rahegi. Record audit trail mein maujood rahega.</div>
          <Field label="Cancel Reason">
            <input className={inputCls} value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} autoFocus />
          </Field>
          <div className="flex gap-2">
            <Btn variant="danger" onClick={confirmCancel}>Confirm Cancel</Btn>
            <Btn variant="ghost" onClick={() => setCancelling(null)}>Cancel</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

function CommissionTransactionDetail({ transaction, onClose }) {
  return (
    <Modal title={`Commission — ${transaction.invoiceNumber}`} onClose={onClose}>
      <div id="print-commission" className="text-sm space-y-1">
        <div className="flex justify-between"><span className="text-slate-500">Agent</span><span className="font-bold">{transaction.agentName}</span></div>
        <div className="flex justify-between"><span className="text-slate-500">Invoice</span><span className="font-bold">{transaction.invoiceNumber}</span></div>
        <div className="flex justify-between"><span className="text-slate-500">Customer</span><span className="font-bold">{transaction.customerName}</span></div>
        <div className="flex justify-between"><span className="text-slate-500">Date</span><span className="font-bold">{fmtDate(transaction.invoiceDate)}</span></div>
        <div className="flex justify-between"><span className="text-slate-500">Sale Amount</span><span className="font-bold">{fmtMoney(transaction.saleAmount)}</span></div>
        {(transaction.breakdown || []).length > 0 && (
          <div className="border-t border-slate-200 pt-2 mt-2">
            <div className="text-[11px] uppercase tracking-wide font-bold text-slate-500 mb-1">Breakdown</div>
            {transaction.breakdown.map((l, idx) => (
              <div key={idx} className="flex justify-between text-xs text-slate-600">
                <span>{l.source} ({fmtCommissionRate(l.commissionType, l.commissionRate)})</span>
                <span className="font-bold">{fmtMoney(l.commission)}</span>
              </div>
            ))}
          </div>
        )}
        <div className="flex justify-between border-t border-slate-300 pt-2 mt-2">
          <span className="font-bold">Commission Amount</span><span className="font-black">{fmtMoney(transaction.commissionAmount)}</span>
        </div>
        <div className="flex justify-between"><span className="text-slate-500">Paid</span><span className="font-bold text-emerald-600">{fmtMoney(transaction.paidAmount)}</span></div>
        <div className="flex justify-between"><span className="text-slate-500">Remaining</span><span className="font-bold text-red-600">{fmtMoney(transaction.remainingAmount)}</span></div>
        <div className="flex justify-between items-center pt-1">
          <span className="text-slate-500">Status</span>
          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 ${COMMISSION_STATUS_TONE[transaction.status] || "bg-slate-100 text-slate-500"}`}>{tStatus(transaction.status)}</span>
        </div>
        {transaction.cancelReason && (
          <div className="text-xs text-slate-400 pt-1">Cancel Reason: {transaction.cancelReason}</div>
        )}
      </div>
      <div className="flex gap-2 mt-4 print:hidden">
        <Btn onClick={() => window.print()}>Print</Btn>
        <Btn variant="ghost" onClick={onClose}>Close</Btn>
      </div>
    </Modal>
  );
}

function CommissionDashboardCards({ transactions }) {
  const active = transactions.filter((tx) => tx.status !== "Cancelled");
  const totalCommission = roundMoney(active.reduce((s, tx) => s + Number(tx.commissionAmount || 0), 0));
  const pending = roundMoney(transactions.filter((tx) => tx.status === "Pending").reduce((s, tx) => s + Number(tx.commissionAmount || 0), 0));
  const approved = roundMoney(transactions.filter((tx) => tx.status === "Approved").reduce((s, tx) => s + Number(tx.commissionAmount || 0), 0));
  const paid = roundMoney(active.reduce((s, tx) => s + Number(tx.paidAmount || 0), 0));
  const outstanding = roundMoney(active.reduce((s, tx) => s + Number(tx.remainingAmount || 0), 0));
  const m = todayISO().slice(0, 7);
  const thisMonth = roundMoney(active.filter((tx) => (tx.invoiceDate || "").startsWith(m)).reduce((s, tx) => s + Number(tx.commissionAmount || 0), 0));

  return (
    <div className="flex flex-wrap gap-3 mb-6">
      <Stat label="Total Commission" value={fmtMoney(totalCommission)} />
      <Stat label="Pending Commission" value={fmtMoney(pending)} accent="text-blue-700" />
      <Stat label="Approved Commission" value={fmtMoney(approved)} accent="text-amber-600" />
      <Stat label="Paid Commission" value={fmtMoney(paid)} accent="text-emerald-600" />
      <Stat label="Outstanding Commission" value={fmtMoney(outstanding)} accent="text-red-600" />
      <Stat label="This Month Commission" value={fmtMoney(thisMonth)} />
    </div>
  );
}

function CommissionPage({
  agents, rules, transactions, payments, products, invoices, currentUser,
  onCreateAgent, onUpdateAgent, onToggleAgentStatus,
  onCreateRule, onUpdateRule,
  onApproveTransaction, onCancelTransaction,
  onPayAgent, onPayTransaction,
}) {
  const [tab, setTab] = useState("dashboard");
  const [viewingTx, setViewingTx] = useState(null);
  const [payModal, setPayModal] = useState(null); // { agent, transaction | null }

  function handleOpenPay(agent, transaction) {
    const resolvedAgent = agent || agents.find((a) => a.id === transaction.agentId);
    if (!resolvedAgent) return;
    setPayModal({ agent: resolvedAgent, transaction: transaction || null });
  }

  function handlePaySubmit(data) {
    if (payModal.transaction) {
      onPayTransaction(payModal.transaction, data);
    } else {
      onPayAgent(payModal.agent, data);
    }
    setPayModal(null);
  }

  const canManage = currentUser?.role === "admin";
  const tabs = [
    ["dashboard", "Commission Dashboard"],
    ["agents", "Commission Agents"],
    ["rules", "Commission Rules"],
    ["history", "Commission History"],
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-xl font-black uppercase tracking-tight">Commission</h2>
        <div className="flex gap-2 flex-wrap">
          {tabs.map(([id, label]) => (
            <Btn key={id} variant={tab === id ? "primary" : "ghost"} small onClick={() => setTab(id)}>{label}</Btn>
          ))}
        </div>
      </div>

      {tab === "dashboard" && (
        <div>
          <CommissionDashboardCards transactions={transactions} />
          <div className="bg-white border border-slate-200 overflow-x-auto">
            <div className="px-4 py-2.5 border-b border-slate-200 font-black uppercase text-xs tracking-wide text-slate-500">Recent Commission Transactions</div>
            <table className="w-full text-sm">
              <tbody>
                {[...transactions].sort((a, b) => new Date(b.invoiceDate) - new Date(a.invoiceDate)).slice(0, 8).map((tx) => (
                  <tr key={tx.id} className="border-t border-slate-100">
                    <td className="px-4 py-2 font-bold text-blue-700">{tx.invoiceNumber}</td>
                    <td className="px-4 py-2">{tx.agentName}</td>
                    <td className="px-4 py-2 text-slate-500">{fmtDate(tx.invoiceDate)}</td>
                    <td className="px-4 py-2 text-right font-bold">{fmtMoney(tx.commissionAmount)}</td>
                    <td className="px-4 py-2"><span className={`text-[10px] font-bold uppercase px-2 py-0.5 ${COMMISSION_STATUS_TONE[tx.status] || "bg-slate-100 text-slate-500"}`}>{tStatus(tx.status)}</span></td>
                  </tr>
                ))}
                {transactions.length === 0 && <tr><td className="px-4 py-6 text-center text-slate-400">Koi commission transaction nahi.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "agents" && (
        <CommissionAgentsPage
          agents={agents} transactions={transactions} payments={payments} currentUser={currentUser}
          onCreateAgent={onCreateAgent} onUpdateAgent={onUpdateAgent} onToggleAgentStatus={onToggleAgentStatus}
          onOpenPay={handleOpenPay}
        />
      )}

      {tab === "rules" && (
        <CommissionRulesPage agents={agents} products={products} rules={rules} currentUser={currentUser} onCreateRule={onCreateRule} onUpdateRule={onUpdateRule} />
      )}

      {tab === "history" && (
        <CommissionHistoryPage
          agents={agents} transactions={transactions} invoices={invoices} currentUser={currentUser}
          onView={(tx) => setViewingTx(tx)}
          onApprove={onApproveTransaction}
          onOpenPay={handleOpenPay}
          onCancel={onCancelTransaction}
        />
      )}

      {viewingTx && <CommissionTransactionDetail transaction={viewingTx} onClose={() => setViewingTx(null)} />}

      {payModal && (
        <Modal title="Pay Commission" onClose={() => setPayModal(null)}>
          <CommissionPaymentForm
            agent={payModal.agent}
            transaction={payModal.transaction}
            remainingTotal={payModal.transaction ? null : computeCommissionSummaryForAgent(payModal.agent.id, transactions, payments).remaining}
            onCancel={() => setPayModal(null)}
            onSave={handlePaySubmit}
          />
        </Modal>
      )}
    </div>
  );
}

/* ---------------- Bookings ---------------- */

function Bookings({ customers, products, bookings, saveBooking, onCreateAdvanceBooking, onConvertToInvoice }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    customerId: customers[0]?.id || "",
    productId: products[0]?.id || "",
    qty: 1,
    rate: products[0]?.price || 0,
    advanceAmount: 0,
    date: todayISO(),
    notes: "",
  });

  const selectedCustomer = customers.find((c) => c.id === form.customerId);

  function pickProduct(productId) {
    const p = products.find((p) => p.id === productId);
    setForm((f) => ({ ...f, productId, rate: p ? p.price : f.rate }));
  }

  function submit() {
    const customer = customers.find((c) => c.id === form.customerId);
    if (!customer) { alert("Customer select karein."); return; }
    if (!Number(form.qty) || !Number(form.rate)) { alert("Qty aur Locked Rate zaroori hai."); return; }
    const product = products.find((p) => p.id === form.productId);
    onCreateAdvanceBooking({
      customerId: form.customerId,
      customerName: customer.name,
      customerPhone: customer.phone || "",
      productId: form.productId,
      productName: product ? product.name : "Custom Item",
      unit: product ? product.unit : "",
      qty: Number(form.qty),
      rate: Number(form.rate),
      advanceAmount: Number(form.advanceAmount) || 0,
      date: form.date,
      notes: form.notes,
    });
    setShowForm(false);
    setForm({ customerId: customers[0]?.id || "", productId: products[0]?.id || "", qty: 1, rate: products[0]?.price || 0, advanceAmount: 0, date: todayISO(), notes: "" });
  }

  function updateStatus(id, status) {
    const b = bookings.find((b) => b.id === id);
    saveBooking({ ...b, status });
  }

  const sorted = [...bookings].sort((a, b) => new Date(b.date) - new Date(a.date));
  const totalValue = Number(form.qty || 0) * Number(form.rate || 0);
  const remaining = totalValue - Number(form.advanceAmount || 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-black uppercase tracking-tight">Advance Booking</h2>
        <Btn onClick={() => setShowForm(true)}>+ New Advance Booking</Btn>
      </div>
      <div className="text-xs text-slate-400 mb-4 max-w-2xl">
        Customer advance de kar rate lock kara sakta hai — booking ke 1 mahine ke andar wahi rate milega, chahe market rate badh jaye.
      </div>
      <div className="bg-white border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-slate-200">
            <th className="px-4 py-2">Ref</th><th className="px-4 py-2">Customer</th><th className="px-4 py-2">Item</th>
            <th className="px-4 py-2 text-right">Qty</th><th className="px-4 py-2 text-right">Locked Rate</th>
            <th className="px-4 py-2 text-right">Advance</th><th className="px-4 py-2 text-right">Remaining</th>
            <th className="px-4 py-2">Valid Till</th><th className="px-4 py-2">Status</th><th></th>
          </tr></thead>
          <tbody>
            {sorted.length === 0 && <tr><td colSpan={10} className="px-4 py-6 text-center text-slate-400">Koi advance booking nahi.</td></tr>}
            {sorted.map((b) => {
              const totalVal = (b.qty || 0) * (b.rate || 0);
              const rem = totalVal - (b.advanceAmount || 0);
              const isExpired = b.expiryDate && todayISO() > b.expiryDate && b.status === "Booked";
              return (
                <tr key={b.id} className="border-t border-slate-100">
                  <td className="px-4 py-2 font-black text-blue-700">{b.code || "-"}</td>
                  <td className="px-4 py-2 font-bold">{b.customerName}</td>
                  <td className="px-4 py-2">{b.productName || "-"} {b.unit ? `(${b.unit})` : ""}</td>
                  <td className="px-4 py-2 text-right">{b.qty}</td>
                  <td className="px-4 py-2 text-right font-bold">{fmtMoney(b.rate)}</td>
                  <td className="px-4 py-2 text-right text-emerald-600 font-bold">{fmtMoney(b.advanceAmount)}</td>
                  <td className="px-4 py-2 text-right text-red-600 font-bold">{fmtMoney(rem)}</td>
                  <td className="px-4 py-2">
                    {fmtDate(b.expiryDate)}
                    {isExpired && <div className="text-[10px] font-bold text-red-600 uppercase">Expired</div>}
                  </td>
                  <td className="px-4 py-2">
                    <select className="text-xs border border-slate-300 px-1.5 py-1" value={b.status} onChange={(e) => updateStatus(b.id, e.target.value)}>
                      {BOOKING_STATUSES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-2 text-right whitespace-nowrap">
                    {(b.status === "Booked" || b.status === "Partially Delivered") && (
                      <button className="text-xs font-bold text-blue-700 hover:underline" onClick={() => onConvertToInvoice(b)}>Convert to Invoice</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {showForm && (
        <Modal title="New Advance Booking" onClose={() => setShowForm(false)}>
          <Field label="Customer">
            <select className={inputCls} value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          {selectedCustomer?.phone && <div className="text-xs text-slate-500 mb-3">Mobile: {selectedCustomer.phone}</div>}
          <Field label="Product">
            <select className={inputCls} value={form.productId} onChange={(e) => pickProduct(e.target.value)}>
              <option value="">Custom Item</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Qty"><input type="number" className={inputCls} value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} /></Field>
            <Field label="Locked Rate (Rs/unit)"><input type="number" className={inputCls} value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Advance Received Now (Rs)"><input type="number" className={inputCls} value={form.advanceAmount} onChange={(e) => setForm({ ...form, advanceAmount: e.target.value })} /></Field>
            <Field label="Booking Date"><input type="date" className={inputCls} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
          </div>
          <Field label="Notes"><input className={inputCls} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>

          <div className="bg-slate-50 border border-slate-200 p-3 text-sm space-y-1 mb-3">
            <div className="flex justify-between"><span>Total Value (Qty × Rate)</span><span className="font-bold">{fmtMoney(totalValue)}</span></div>
            <div className="flex justify-between"><span>Advance Received</span><span className="font-bold text-emerald-600">{fmtMoney(form.advanceAmount)}</span></div>
            <div className="flex justify-between border-t border-slate-300 pt-1"><span className="font-bold">Remaining on Delivery</span><span className="font-black text-red-600">{fmtMoney(remaining)}</span></div>
            <div className="text-[11px] text-slate-400 pt-1">Valid till: {fmtDate(addOneMonth(form.date))} — is tareekh tak yehi rate lock rahega.</div>
          </div>

          <div className="flex gap-2"><Btn onClick={submit}>Save Advance Booking</Btn><Btn variant="ghost" onClick={() => setShowForm(false)}>Cancel</Btn></div>
        </Modal>
      )}
    </div>
  );
}

/* ---------------- Orders (Daily Call Orders) ---------------- */

function Orders({ customers, products, orders, onCreateOrder, saveOrder, onConvertToInvoice }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    customerId: customers[0]?.id || "",
    productId: products[0]?.id || "",
    qty: 1,
    requestedFor: "Kal Subah",
    date: todayISO(),
    notes: "",
  });

  const selectedCustomer = customers.find((c) => c.id === form.customerId);

  function submit() {
    const customer = customers.find((c) => c.id === form.customerId);
    if (!customer) { alert("Customer select karein."); return; }
    if (!Number(form.qty)) { alert("Qty zaroori hai."); return; }
    const product = products.find((p) => p.id === form.productId);
    onCreateOrder({
      customerId: form.customerId,
      customerName: customer.name,
      customerPhone: customer.phone || "",
      productId: form.productId,
      productName: product ? product.name : "Custom Item",
      unit: product ? product.unit : "",
      qty: Number(form.qty),
      requestedFor: form.requestedFor,
      date: form.date,
      notes: form.notes,
    });
    setShowForm(false);
    setForm({ customerId: customers[0]?.id || "", productId: products[0]?.id || "", qty: 1, requestedFor: "Kal Subah", date: todayISO(), notes: "" });
  }

  function updateStatus(id, status) {
    const o = orders.find((o) => o.id === id);
    saveOrder({ ...o, status });
  }

  const total = orders.length;
  const pending = orders.filter((o) => o.status === "Pending").length;
  const processing = orders.filter((o) => o.status === "Processing").length;
  const completed = orders.filter((o) => o.status === "Completed").length;

  const sorted = [...orders].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-black uppercase tracking-tight">Daily Orders</h2>
        <Btn onClick={() => setShowForm(true)} disabled={customers.length === 0}>+ New Order</Btn>
      </div>
      <div className="text-xs text-slate-400 mb-4 max-w-2xl">
        Jab customer call kar ke order de ("mujhe subah cement chahiye"), yahan note kar lein — baad mein isi order se seedha invoice ban jayegi.
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <Stat label="Total Orders" value={total} />
        <Stat label="Pending" value={pending} accent="text-red-600" />
        <Stat label="Processing" value={processing} accent="text-blue-700" />
        <Stat label="Completed" value={completed} accent="text-emerald-600" />
      </div>

      <div className="bg-white border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-slate-200">
            <th className="px-4 py-2">Ref</th><th className="px-4 py-2">Customer</th><th className="px-4 py-2">Phone</th>
            <th className="px-4 py-2">Item</th><th className="px-4 py-2 text-right">Qty</th>
            <th className="px-4 py-2">Requested For</th><th className="px-4 py-2">Status</th><th></th>
          </tr></thead>
          <tbody>
            {sorted.length === 0 && <tr><td colSpan={8} className="px-4 py-6 text-center text-slate-400">Koi order nahi.</td></tr>}
            {sorted.map((o) => (
              <tr key={o.id} className="border-t border-slate-100">
                <td className="px-4 py-2 font-black text-blue-700">{o.code}</td>
                <td className="px-4 py-2 font-bold">{o.customerName}</td>
                <td className="px-4 py-2 text-slate-500">{o.customerPhone || "-"}</td>
                <td className="px-4 py-2">{o.productName || "-"} {o.unit ? `(${o.unit})` : ""}</td>
                <td className="px-4 py-2 text-right">{o.qty}</td>
                <td className="px-4 py-2 text-slate-500">{o.requestedFor || "-"}</td>
                <td className="px-4 py-2">
                  <select className="text-xs border border-slate-300 px-1.5 py-1" value={o.status} onChange={(e) => updateStatus(o.id, e.target.value)}>
                    {ORDER_STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </td>
                <td className="px-4 py-2 text-right whitespace-nowrap">
                  {(o.status === "Pending" || o.status === "Processing") && (
                    <button className="text-xs font-bold text-blue-700 hover:underline" onClick={() => onConvertToInvoice(o)}>Convert to Invoice</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <Modal title="New Order" onClose={() => setShowForm(false)}>
          <Field label="Customer">
            <select className={inputCls} value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          {selectedCustomer?.phone && <div className="text-xs text-slate-500 mb-3">Phone: {selectedCustomer.phone}</div>}
          <Field label="Product">
            <select className={inputCls} value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })}>
              <option value="">Custom Item</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Qty"><input type="number" className={inputCls} value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} /></Field>
            <Field label="Requested For">
              <input className={inputCls} placeholder="e.g. Kal Subah, Aaj Shaam" value={form.requestedFor} onChange={(e) => setForm({ ...form, requestedFor: e.target.value })} />
            </Field>
          </div>
          <Field label="Order Date (call received)"><input type="date" className={inputCls} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
          <Field label="Notes"><input className={inputCls} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
          <div className="flex gap-2"><Btn onClick={submit}>Save Order</Btn><Btn variant="ghost" onClick={() => setShowForm(false)}>Cancel</Btn></div>
        </Modal>
      )}
    </div>
  );
}

/* ---------------- Promise To Pay (Phase 3) ---------------- */

function PromiseForm({ customers, invoices, payments, returns, exchanges, promises, transfers, adjustments, initial, onSave, onCancel }) {
  const [customerId, setCustomerId] = useState(initial?.customerId || customers[0]?.id || "");
  const [custSearch, setCustSearch] = useState("");
  const [amount, setAmount] = useState(initial?.amount ?? "");
  const [promiseDate, setPromiseDate] = useState(initial?.promiseDate || todayISO());
  const [expectedDate, setExpectedDate] = useState(initial?.expectedDate || todayISO());
  const [notes, setNotes] = useState(initial?.notes || "");
  const [error, setError] = useState("");

  const customer = customers.find((c) => c.id === customerId);
  const outstanding = customer ? computeLedgerForCustomer(customer, invoices, payments, returns, exchanges, promises, transfers, adjustments).outstanding : 0;
  const filteredCustomers = customers.filter((c) => c.name.toLowerCase().includes(custSearch.toLowerCase()));
  const isEdit = !!initial;

  function submit() {
    if (!customerId) { setError("Customer select karein."); return; }
    if (!Number(amount) || Number(amount) <= 0) { setError("Promise amount zaroori hai."); return; }
    if (!expectedDate) { setError("Expected Payment Date zaroori hai."); return; }
    setError("");
    const cust = customers.find((c) => c.id === customerId);
    onSave({ customerId, customerName: cust.name, amount: Number(amount), promiseDate, expectedDate, notes: notes.trim() });
  }

  return (
    <div>
      {!isEdit ? (
        <Field label="Customer">
          <input className={`${inputCls} mb-1`} placeholder="Search customer..." value={custSearch} onChange={(e) => setCustSearch(e.target.value)} />
          <select className={inputCls} value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
            {filteredCustomers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
      ) : (
        <div className="text-sm font-bold text-slate-700 bg-slate-50 border border-slate-200 px-3 py-2 mb-3">{customer?.name}</div>
      )}
      {customer && (
        <div className="text-xs text-slate-500 mb-3">
          Current Outstanding: <span className={`font-black ${outstanding > 0 ? "text-red-600" : "text-emerald-600"}`}>{fmtMoney(outstanding)}</span>
        </div>
      )}
      <Field label="Promise Amount (Rs)">
        <input type="number" className={inputCls} value={amount} onChange={(e) => setAmount(e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Promise Date">
          <input type="date" className={inputCls} value={promiseDate} onChange={(e) => setPromiseDate(e.target.value)} />
        </Field>
        <Field label="Expected Payment Date">
          <input type="date" className={inputCls} value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} />
        </Field>
      </div>
      <Field label="Notes (optional)">
        <input className={inputCls} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>
      {error && <div className="text-red-600 text-sm font-semibold mb-3">{error}</div>}
      <div className="flex gap-2 mt-2">
        <Btn onClick={submit}>{isEdit ? "Save Changes" : "Save Promise"}</Btn>
        <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
      </div>
    </div>
  );
}

function PromiseCalendar({ promises }) {
  const active = promises.filter((p) => p.status !== "Deleted").map(promiseWithComputed);
  const byDate = {};
  active.forEach((p) => {
    if (p.status === "Completed" || p.status === "Cancelled") return;
    if (!byDate[p.expectedDate]) byDate[p.expectedDate] = [];
    byDate[p.expectedDate].push(p);
  });
  const dates = Object.keys(byDate).sort();

  return (
    <div className="bg-white border border-slate-200 overflow-x-auto">
      <div className="px-4 py-2.5 border-b border-slate-200 font-black uppercase text-xs tracking-wide text-slate-500">Calendar — Upcoming Promised Payments</div>
      {dates.length === 0 ? (
        <div className="px-4 py-6 text-center text-slate-400">Koi promise nahi mila.</div>
      ) : (
        <div className="divide-y divide-slate-100">
          {dates.map((d) => (
            <div key={d} className="px-4 py-2.5">
              <div className="text-xs font-black uppercase text-slate-500 mb-1">
                {fmtDate(d)} {d === todayISO() ? <span className="text-blue-700">(Today)</span> : ""}
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                {byDate[d].map((p) => (
                  <div key={p.id}>
                    <span className="font-bold">{p.customerName}</span> — <span className="font-black text-blue-700">{fmtMoney(p.remainingAmount)}</span>{" "}
                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 ${PROMISE_STATUS_TONE[p.status]}`}>{p.status}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PromiseToPayPage({ customers, invoices, payments, returns, exchanges, promises, transfers, adjustments, currentUser, onCreatePromise, onUpdatePromise, onCancelPromise, focusPromiseId, setFocusPromiseId }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [cancelling, setCancelling] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [view, setView] = useState("list"); // list | calendar

  const canCancel = currentUser?.role === "admin";

  const active = promises.filter((p) => p.status !== "Deleted").map(promiseWithComputed);
  const filtered = active
    .filter((p) => statusFilter === "All" || p.status === statusFilter)
    .filter((p) => !q.trim() || p.customerName.toLowerCase().includes(q.toLowerCase()) || p.code.toLowerCase().includes(q.toLowerCase()) || String(p.amount).includes(q))
    .sort((a, b) => new Date(a.expectedDate) - new Date(b.expectedDate));

  useEffect(() => {
    if (focusPromiseId) {
      const p = promises.find((p) => p.id === focusPromiseId);
      if (p) { setQ(p.code); }
      setFocusPromiseId(null);
    }
  }, [focusPromiseId]);

  function confirmCancel() {
    if (currentUser?.role !== "admin") { alert("Sirf Admin promise cancel kar sakta hai."); return; }
    if (!cancelReason.trim()) { alert("Reason likhna zaroori hai."); return; }
    onCancelPromise(cancelling, cancelReason.trim());
    setCancelling(null); setCancelReason("");
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <h2 className="text-xl font-black uppercase tracking-tight">Promise To Pay</h2>
        <div className="flex gap-2">
          <Btn variant={view === "list" ? "primary" : "ghost"} small onClick={() => setView("list")}>List</Btn>
          <Btn variant={view === "calendar" ? "primary" : "ghost"} small onClick={() => setView("calendar")}>Calendar</Btn>
          <Btn onClick={() => { setEditing(null); setShowForm(true); }} disabled={customers.length === 0}>+ New Promise</Btn>
        </div>
      </div>
      <div className="text-xs text-slate-400 mb-4 max-w-2xl">
        Jab customer kahe "main is tareekh tak itna pay kar dunga", yahan record karein — status apne aap update hota rahega aur overdue promises "Broken Promise" ban jayenge.
      </div>

      {view === "calendar" ? (
        <PromiseCalendar promises={promises} />
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mb-3">
            <input className={`${inputCls} max-w-xs`} placeholder="Search customer / promise # / amount / status..." value={q} onChange={(e) => setQ(e.target.value)} />
            <select className={`${inputCls} max-w-[180px]`} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="All">All Status</option>
              {PROMISE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="bg-white border border-slate-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-slate-200">
                <th className="px-4 py-2">Promise #</th><th className="px-4 py-2">Customer</th><th className="px-4 py-2 text-right">Amount</th>
                <th className="px-4 py-2">Promise Date</th><th className="px-4 py-2">Expected Date</th><th className="px-4 py-2 text-right">Paid</th>
                <th className="px-4 py-2 text-right">Remaining</th><th className="px-4 py-2">Status</th><th></th>
              </tr></thead>
              <tbody>
                {filtered.length === 0 && <tr><td colSpan={9} className="px-4 py-6 text-center text-slate-400">Koi promise nahi mila.</td></tr>}
                {filtered.map((p) => (
                  <tr key={p.id} className="border-t border-slate-100">
                    <td className="px-4 py-2 font-black text-blue-700">{p.code}</td>
                    <td className="px-4 py-2 font-bold">{p.customerName}</td>
                    <td className="px-4 py-2 text-right font-bold">{fmtMoney(p.amount)}</td>
                    <td className="px-4 py-2 text-slate-500">{fmtDate(p.promiseDate)}</td>
                    <td className="px-4 py-2 text-slate-500">{fmtDate(p.expectedDate)}</td>
                    <td className="px-4 py-2 text-right text-emerald-600 font-bold">{fmtMoney(p.paidAmount)}</td>
                    <td className="px-4 py-2 text-right text-red-600 font-bold">{fmtMoney(p.remainingAmount)}</td>
                    <td className="px-4 py-2"><span className={`text-[10px] font-bold uppercase px-2 py-0.5 ${PROMISE_STATUS_TONE[p.status]}`}>{p.status}</span></td>
                    <td className="px-4 py-2 text-right whitespace-nowrap space-x-2">
                      {p.status !== "Completed" && p.status !== "Cancelled" && (
                        <button className="text-xs font-bold text-slate-500 hover:text-blue-700" onClick={() => { setEditing(p); setShowForm(true); }}>Edit</button>
                      )}
                      {canCancel && p.status !== "Cancelled" && p.status !== "Completed" && (
                        <button className="text-xs font-bold text-slate-500 hover:text-red-600" onClick={() => setCancelling(p)}>Cancel</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {showForm && (
        <Modal title={editing ? `Edit Promise ${editing.code}` : "New Promise"} onClose={() => { setShowForm(false); setEditing(null); }}>
          <PromiseForm
            customers={customers} invoices={invoices} payments={payments} returns={returns} exchanges={exchanges}
            promises={promises} transfers={transfers} adjustments={adjustments} initial={editing}
            onCancel={() => { setShowForm(false); setEditing(null); }}
            onSave={(data) => { editing ? onUpdatePromise(editing, data) : onCreatePromise(data); setShowForm(false); setEditing(null); }}
          />
        </Modal>
      )}

      {cancelling && (
        <Modal title={`Cancel Promise ${cancelling.code}`} onClose={() => setCancelling(null)}>
          <div className="text-sm text-slate-600 mb-3">Ye promise cancel karne se history mein "Cancelled" reh jayega — ledger se hatega nahi.</div>
          <Field label="Reason">
            <input className={inputCls} value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} autoFocus />
          </Field>
          <div className="flex gap-2">
            <Btn variant="danger" onClick={confirmCancel}>Confirm Cancel</Btn>
            <Btn variant="ghost" onClick={() => setCancelling(null)}>Cancel</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ---------------- Leads ---------------- */

function Leads({ leads, saveLead, deleteLead }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "", source: "", audienceType: "Builder", status: "New", followUpDate: "", notes: "" });

  function openNew() { setEditing(null); setForm({ name: "", phone: "", source: "", audienceType: "Builder", status: "New", followUpDate: "", notes: "" }); setShowForm(true); }
  function openEdit(l) { setEditing(l); setForm(l); setShowForm(true); }

  function submit() {
    if (!form.name.trim()) { alert("Lead ka naam zaroori hai."); return; }
    if (editing) saveLead({ ...editing, ...form });
    else saveLead({ id: uid("lead"), code: "LEA-" + Math.floor(1000 + Math.random() * 9000), ...form, createdAt: todayISO() });
    setShowForm(false);
  }

  function updateStatus(l, status) { saveLead({ ...l, status }); }

  const sorted = [...leads].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-black uppercase tracking-tight">Leads</h2>
        <Btn onClick={openNew}>+ New Lead</Btn>
      </div>
      <div className="bg-white border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-slate-200">
            <th className="px-4 py-2">Ref</th><th className="px-4 py-2">Name</th><th className="px-4 py-2">Phone</th>
            <th className="px-4 py-2">Source</th><th className="px-4 py-2">Audience</th><th className="px-4 py-2">Follow-up</th>
            <th className="px-4 py-2">Status</th><th></th>
          </tr></thead>
          <tbody>
            {sorted.length === 0 && <tr><td colSpan={8} className="px-4 py-6 text-center text-slate-400">Koi lead nahi.</td></tr>}
            {sorted.map((l) => (
              <tr key={l.id} className="border-t border-slate-100">
                <td className="px-4 py-2 font-black text-blue-700">{l.code}</td>
                <td className="px-4 py-2 font-bold cursor-pointer hover:text-blue-700" onClick={() => openEdit(l)}>{l.name}</td>
                <td className="px-4 py-2 text-slate-500">{l.phone || "-"}</td>
                <td className="px-4 py-2 text-slate-500">{l.source || "-"}</td>
                <td className="px-4 py-2 text-slate-500">{l.audienceType}</td>
                <td className="px-4 py-2 text-slate-500">{l.followUpDate ? fmtDate(l.followUpDate) : "-"}</td>
                <td className="px-4 py-2">
                  <select className="text-xs border border-slate-300 px-1.5 py-1" value={l.status} onChange={(e) => updateStatus(l, e.target.value)}>
                    {LEAD_STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </td>
                <td className="px-4 py-2 text-right whitespace-nowrap">
                  <button className="text-xs font-bold text-slate-500 hover:text-blue-700 mr-3" onClick={() => openEdit(l)}>Edit</button>
                  <button className="text-xs font-bold text-slate-500 hover:text-red-600" onClick={() => { if (confirm(`Delete lead ${l.name}?`)) deleteLead(l.id); }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showForm && (
        <Modal title={editing ? "Edit Lead" : "New Lead"} onClose={() => setShowForm(false)}>
          <Field label="Name"><input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Phone"><input className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field label="Source"><input className={inputCls} placeholder="e.g. Referral, Site visit" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} /></Field>
          <Field label="Audience Type">
            <select className={inputCls} value={form.audienceType} onChange={(e) => setForm({ ...form, audienceType: e.target.value })}>
              {AUDIENCE_TYPES.map((a) => <option key={a}>{a}</option>)}
            </select>
          </Field>
          <Field label="Follow-up Date"><input type="date" className={inputCls} value={form.followUpDate} onChange={(e) => setForm({ ...form, followUpDate: e.target.value })} /></Field>
          <Field label="Notes"><input className={inputCls} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
          <div className="flex gap-2"><Btn onClick={submit}>Save Lead</Btn><Btn variant="ghost" onClick={() => setShowForm(false)}>Cancel</Btn></div>
        </Modal>
      )}
    </div>
  );
}

/* ---------------- Products ---------------- */

function Products({ products, saveProduct, deleteProduct }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", unit: "Bag", price: 0 });

  function openNew() { setEditing(null); setForm({ name: "", unit: "Bag", price: 0 }); setShowForm(true); }
  function openEdit(p) { setEditing(p); setForm(p); setShowForm(true); }

  function submit() {
    if (!form.name.trim()) { alert("Product ka naam zaroori hai."); return; }
    if (editing) saveProduct({ ...editing, ...form, price: Number(form.price) });
    else saveProduct({ id: uid("prod"), ...form, price: Number(form.price) });
    setShowForm(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-black uppercase tracking-tight">Products</h2>
        <Btn onClick={openNew}>+ New Purchase</Btn>
      </div>
      <div className="bg-white border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-slate-200">
            <th className="px-4 py-2">Product Name</th><th className="px-4 py-2">Unit</th><th className="px-4 py-2 text-right">Rate</th><th></th>
          </tr></thead>
          <tbody>
            {products.length === 0 && <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400">Koi product nahi.</td></tr>}
            {products.map((p) => (
              <tr key={p.id} className="border-t border-slate-100">
                <td className="px-4 py-2 font-bold">{p.name}</td>
                <td className="px-4 py-2 text-slate-500">{p.unit}</td>
                <td className="px-4 py-2 text-right font-bold">{fmtMoney(p.price)}</td>
                <td className="px-4 py-2 text-right whitespace-nowrap">
                  <button className="text-xs font-bold text-slate-500 hover:text-blue-700 mr-3" onClick={() => openEdit(p)}>Edit</button>
                  <button className="text-xs font-bold text-slate-500 hover:text-red-600" onClick={() => { if (confirm(`Delete ${p.name}?`)) deleteProduct(p.id); }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showForm && (
        <Modal title={editing ? "Edit Product" : "New Product"} onClose={() => setShowForm(false)}>
          <Field label="Product Name"><input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Unit">
            <input list="unit-suggestions" className={inputCls} value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
          </Field>
          <Field label="Rate / Unit"><input type="number" className={inputCls} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></Field>
          <div className="flex gap-2"><Btn onClick={submit}>Save Product</Btn><Btn variant="ghost" onClick={() => setShowForm(false)}>Cancel</Btn></div>
        </Modal>
      )}
    </div>
  );
}

/* ---------------- Offers ---------------- */

function OfferForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || { text: "", active: true, bannerUrl: "" });
  async function handleBanner(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { alert("Sirf image file (PNG/JPG) upload karein."); return; }
    try {
      const dataUrl = await resizeImageToDataUrl(file, 800);
      setForm({ ...form, bannerUrl: dataUrl });
    } catch { alert("Banner upload nahi ho saka, dobara try karein."); }
  }
  function submit() {
    if (!form.text.trim()) { alert("Offer ka text zaroori hai."); return; }
    onSave(form);
  }
  return (
    <div>
      <Field label="Offer Text (scrolling ticker mein dikhega)">
        <input className={inputCls} value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} placeholder="e.g. Is hafte cement par Rs 50/bag discount!" />
      </Field>
      <Field label="Banner Image (optional)">
        {form.bannerUrl ? (
          <div className="flex items-center gap-2">
            <img src={form.bannerUrl} alt="Banner" className="h-16 object-contain border border-slate-200" />
            <button type="button" className="text-xs font-bold text-red-600" onClick={() => setForm({ ...form, bannerUrl: "" })}>Remove</button>
          </div>
        ) : (
          <input type="file" accept="image/*" onChange={handleBanner} className="text-xs" />
        )}
      </Field>
      <Field label="Active (customer portal mein dikhaya jaye)">
        <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
      </Field>
      <div className="flex gap-2 mt-2"><Btn onClick={submit}>Save Offer</Btn><Btn variant="ghost" onClick={onCancel}>Cancel</Btn></div>
    </div>
  );
}

function Offers({ offers, saveOffer, deleteOffer }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-black uppercase tracking-tight">Offers</h2>
        <Btn onClick={() => { setEditing(null); setShowForm(true); }}>+ New Offer</Btn>
      </div>
      <div className="bg-white border border-slate-200 divide-y divide-slate-100">
        {offers.length === 0 && <div className="px-4 py-6 text-center text-slate-400">Koi offer nahi bana.</div>}
        {offers.map((o) => (
          <div key={o.id} className="px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {o.bannerUrl && <img src={o.bannerUrl} alt="" className="h-10 w-16 object-cover border border-slate-200" />}
              <div>
                <div className="font-bold text-sm">{o.text}</div>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 ${o.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>{o.active ? "Active" : "Inactive"}</span>
              </div>
            </div>
            <div className="whitespace-nowrap">
              <button className="text-xs font-bold text-slate-500 hover:text-blue-700 mr-3" onClick={() => { setEditing(o); setShowForm(true); }}>Edit</button>
              <button className="text-xs font-bold text-slate-500 hover:text-red-600" onClick={() => { if (confirm("Delete this offer?")) deleteOffer(o.id); }}>Delete</button>
            </div>
          </div>
        ))}
      </div>
      {showForm && (
        <Modal title={editing ? "Edit Offer" : "New Offer"} onClose={() => setShowForm(false)}>
          <OfferForm initial={editing} onCancel={() => setShowForm(false)} onSave={(data) => { editing ? saveOffer({ ...editing, ...data }) : saveOffer({ id: uid("off"), ...data }); setShowForm(false); }} />
        </Modal>
      )}
    </div>
  );
}

/* ---------------- Drivers ---------------- */

function DriverForm({ initial, onSave, onCancel, nextCode }) {
  const [form, setForm] = useState(initial || { name: "", phone: "", vehicleType: "Rickshaw", vehicleNumber: "" });
  function submit() {
    if (!form.name.trim()) { alert("Driver ka naam zaroori hai."); return; }
    onSave(form);
  }
  return (
    <div>
      {!initial && <div className="text-xs text-slate-500 mb-3">ID: <span className="font-bold">{nextCode}</span></div>}
      <Field label="Driver Name"><input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
      <Field label="Phone"><input className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
      <Field label="Vehicle Type">
        <select className={inputCls} value={form.vehicleType} onChange={(e) => setForm({ ...form, vehicleType: e.target.value })}>
          {VEHICLE_TYPES.map((v) => <option key={v}>{v}</option>)}
        </select>
      </Field>
      <Field label="Vehicle Number"><input className={inputCls} value={form.vehicleNumber} onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value })} /></Field>
      <div className="flex gap-2 mt-2"><Btn onClick={submit}>Save Driver</Btn><Btn variant="ghost" onClick={onCancel}>Cancel</Btn></div>
    </div>
  );
}

function Drivers({ drivers, saveDriver, deleteDriver, nextCode }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-black uppercase tracking-tight">Drivers</h2>
        <Btn onClick={() => { setEditing(null); setShowForm(true); }}>+ New Driver</Btn>
      </div>
      <div className="bg-white border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-slate-200">
            <th className="px-4 py-2">Driver ID</th><th className="px-4 py-2">Name</th><th className="px-4 py-2">Phone</th>
            <th className="px-4 py-2">Vehicle</th><th className="px-4 py-2">Number</th><th></th>
          </tr></thead>
          <tbody>
            {drivers.length === 0 && <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400">Koi driver add nahi hua.</td></tr>}
            {drivers.map((d) => (
              <tr key={d.id} className="border-t border-slate-100">
                <td className="px-4 py-2 font-black text-blue-700">{d.code}</td>
                <td className="px-4 py-2 font-bold">{d.name}</td>
                <td className="px-4 py-2 text-slate-500">{d.phone || "-"}</td>
                <td className="px-4 py-2 text-slate-500">{d.vehicleType}</td>
                <td className="px-4 py-2 text-slate-500">{d.vehicleNumber || "-"}</td>
                <td className="px-4 py-2 text-right whitespace-nowrap">
                  <button className="text-xs font-bold text-slate-500 hover:text-blue-700 mr-3" onClick={() => { setEditing(d); setShowForm(true); }}>Edit</button>
                  <button className="text-xs font-bold text-slate-500 hover:text-red-600" onClick={() => { if (confirm(`Delete ${d.name}?`)) deleteDriver(d.id); }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showForm && (
        <Modal title={editing ? `Edit Driver ${editing.code}` : "New Driver"} onClose={() => setShowForm(false)}>
          <DriverForm initial={editing} nextCode={nextCode} onCancel={() => setShowForm(false)} onSave={(data) => { editing ? saveDriver({ ...editing, ...data }) : saveDriver({ id: uid("drv"), code: nextCode, ...data }); setShowForm(false); }} />
        </Modal>
      )}
    </div>
  );
}

/* ---------------- Reports ---------------- */

function Reports({ customers, invoices, payments, returns, exchanges, promises, transfers, adjustments, orders, commissionAgents, commissionRules, commissionTransactions, products }) {
  const [from, setFrom] = useState(todayISO().slice(0, 8) + "01");
  const [to, setTo] = useState(todayISO());
  const [commissionView, setCommissionView] = useState("agent"); // agent | date | product | customer
  const [commissionRangePreset, setCommissionRangePreset] = useState("This Month");
  const [commissionFrom, setCommissionFrom] = useState(todayISO().slice(0, 8) + "01");
  const [commissionTo, setCommissionTo] = useState(todayISO());

  const inRange = (d) => d >= from && d <= to;

  const salesInRange = invoices.filter((i) => inRange(i.date) && i.docStatus !== "Cancelled").reduce((s, i) => s + i.total, 0);
  const collectedInRange = payments.filter((p) => inRange(p.date)).reduce((s, p) => s + p.amount, 0);
  const totalInvoices = invoices.filter((i) => inRange(i.date)).length;
  const totalOrders = orders.filter((o) => inRange(o.date)).length;
  const totalReturnAmount = returns.filter((r) => inRange(r.date) && r.status !== "Deleted").reduce((s, r) => s + r.amount, 0);

  const outstandingCustomers = customers
    .map((c) => ({ ...c, outstanding: computeLedgerForCustomer(c, invoices, payments, returns, exchanges, promises, transfers, adjustments).outstanding }))
    .filter((c) => c.outstanding > 0)
    .sort((a, b) => b.outstanding - a.outstanding);

  function exportCSV() {
    const rows = [["Customer", "Outstanding"], ...outstandingCustomers.map((c) => [c.name, c.outstanding])];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `outstanding_${from}_to_${to}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  // Commission Reports date range presets.
  useEffect(() => {
    const t = todayISO();
    if (commissionRangePreset === "Today") { setCommissionFrom(t); setCommissionTo(t); }
    else if (commissionRangePreset === "This Week") {
      const d = new Date(); const day = d.getDay(); const monday = new Date(d); monday.setDate(d.getDate() - ((day + 6) % 7));
      setCommissionFrom(monday.toISOString().slice(0, 10)); setCommissionTo(t);
    } else if (commissionRangePreset === "This Month") {
      setCommissionFrom(t.slice(0, 8) + "01"); setCommissionTo(t);
    }
    // "Custom Range" leaves commissionFrom/commissionTo as manually set.
  }, [commissionRangePreset]);

  const commissionInRange = (commissionTransactions || []).filter((tx) => tx.status !== "Cancelled" && tx.invoiceDate >= commissionFrom && tx.invoiceDate <= commissionTo);

  const agentWise = useMemo(() => {
    const map = {};
    commissionInRange.forEach((tx) => {
      if (!map[tx.agentId]) map[tx.agentId] = { agentName: tx.agentName, count: 0, commission: 0, paid: 0, remaining: 0 };
      map[tx.agentId].count += 1;
      map[tx.agentId].commission += Number(tx.commissionAmount) || 0;
      map[tx.agentId].paid += Number(tx.paidAmount) || 0;
      map[tx.agentId].remaining += Number(tx.remainingAmount) || 0;
    });
    return Object.entries(map).map(([agentId, v]) => ({ agentId, ...v })).sort((a, b) => b.commission - a.commission);
  }, [commissionInRange]);

  const dateWise = useMemo(() => {
    const map = {};
    commissionInRange.forEach((tx) => {
      if (!map[tx.invoiceDate]) map[tx.invoiceDate] = { count: 0, commission: 0 };
      map[tx.invoiceDate].count += 1;
      map[tx.invoiceDate].commission += Number(tx.commissionAmount) || 0;
    });
    return Object.entries(map).map(([date, v]) => ({ date, ...v })).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [commissionInRange]);

  const productWise = useMemo(() => {
    const map = {};
    commissionInRange.forEach((tx) => {
      (tx.breakdown || []).forEach((l) => {
        const key = l.source || "Other";
        if (!map[key]) map[key] = { source: key, commission: 0 };
        map[key].commission += Number(l.commission) || 0;
      });
    });
    return Object.values(map).sort((a, b) => b.commission - a.commission);
  }, [commissionInRange]);

  const customerWise = useMemo(() => {
    const map = {};
    commissionInRange.forEach((tx) => {
      if (!map[tx.customerId]) map[tx.customerId] = { customerName: tx.customerName, count: 0, commission: 0 };
      map[tx.customerId].count += 1;
      map[tx.customerId].commission += Number(tx.commissionAmount) || 0;
    });
    return Object.entries(map).map(([customerId, v]) => ({ customerId, ...v })).sort((a, b) => b.commission - a.commission);
  }, [commissionInRange]);

  return (
    <div>
      <h2 className="text-xl font-black uppercase tracking-tight mb-4">Reports</h2>

      <div className="flex flex-wrap items-end gap-3 mb-4">
        <Field label="From"><input type="date" className={inputCls} value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
        <Field label="To"><input type="date" className={inputCls} value={to} onChange={(e) => setTo(e.target.value)} /></Field>
        <Btn variant="dark" onClick={exportCSV}>Export Excel (CSV)</Btn>
        <Btn variant="ghost" onClick={() => window.print()}>Export PDF</Btn>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <Stat label="Sales in Range" value={fmtMoney(salesInRange)} />
        <Stat label="Collected in Range" value={fmtMoney(collectedInRange)} accent="text-emerald-600" />
        <Stat label="Total Invoices" value={totalInvoices} />
        <Stat label="Total Orders" value={totalOrders} />
        <Stat label="Total Return Amount" value={fmtMoney(totalReturnAmount)} accent="text-red-600" />
      </div>

      <div className="bg-white border border-slate-200 overflow-x-auto mb-8">
        <div className="px-4 py-2.5 border-b border-slate-200 font-black uppercase text-xs tracking-wide text-slate-500">Customers with Outstanding Balance</div>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-slate-200">
            <th className="px-4 py-2">Customer</th><th className="px-4 py-2 text-right">Outstanding</th>
          </tr></thead>
          <tbody>
            {outstandingCustomers.length === 0 && <tr><td colSpan={2} className="px-4 py-6 text-center text-slate-400">Koi outstanding nahi.</td></tr>}
            {outstandingCustomers.map((c) => (
              <tr key={c.id} className="border-t border-slate-100">
                <td className="px-4 py-2 font-bold">{c.name}</td>
                <td className="px-4 py-2 text-right font-black text-red-600">{fmtMoney(c.outstanding)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Commission Reports */}
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <h3 className="text-lg font-black uppercase tracking-tight">Commission Reports</h3>
        <div className="flex gap-2 flex-wrap items-end">
          {["Today", "This Week", "This Month", "Custom Range"].map((preset) => (
            <Btn key={preset} variant={commissionRangePreset === preset ? "primary" : "ghost"} small onClick={() => setCommissionRangePreset(preset)}>{preset}</Btn>
          ))}
          {commissionRangePreset === "Custom Range" && (
            <>
              <input type="date" className={`${inputCls} max-w-[150px]`} value={commissionFrom} onChange={(e) => setCommissionFrom(e.target.value)} />
              <input type="date" className={`${inputCls} max-w-[150px]`} value={commissionTo} onChange={(e) => setCommissionTo(e.target.value)} />
            </>
          )}
        </div>
      </div>
      <div className="flex gap-2 mb-3">
        {[["agent", "Agent-wise"], ["date", "Date-wise"], ["product", "Product-wise"], ["customer", "Customer-wise"]].map(([id, label]) => (
          <Btn key={id} variant={commissionView === id ? "primary" : "ghost"} small onClick={() => setCommissionView(id)}>{label}</Btn>
        ))}
      </div>

      {commissionView === "agent" && (
        <div className="bg-white border border-slate-200 overflow-x-auto mb-8">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-slate-200">
              <th className="px-4 py-2">Agent</th><th className="px-4 py-2 text-right">Transactions</th>
              <th className="px-4 py-2 text-right">Commission</th><th className="px-4 py-2 text-right">Paid</th><th className="px-4 py-2 text-right">Remaining</th>
            </tr></thead>
            <tbody>
              {agentWise.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">Koi record nahi.</td></tr>}
              {agentWise.map((a) => (
                <tr key={a.agentId} className="border-t border-slate-100">
                  <td className="px-4 py-2 font-bold">{a.agentName}</td>
                  <td className="px-4 py-2 text-right">{a.count}</td>
                  <td className="px-4 py-2 text-right font-bold">{fmtMoney(a.commission)}</td>
                  <td className="px-4 py-2 text-right text-emerald-600 font-bold">{fmtMoney(a.paid)}</td>
                  <td className="px-4 py-2 text-right text-red-600 font-bold">{fmtMoney(a.remaining)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {commissionView === "date" && (
        <div className="bg-white border border-slate-200 overflow-x-auto mb-8">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-slate-200">
              <th className="px-4 py-2">Date</th><th className="px-4 py-2 text-right">Transactions</th><th className="px-4 py-2 text-right">Commission</th>
            </tr></thead>
            <tbody>
              {dateWise.length === 0 && <tr><td colSpan={3} className="px-4 py-6 text-center text-slate-400">Koi record nahi.</td></tr>}
              {dateWise.map((d) => (
                <tr key={d.date} className="border-t border-slate-100">
                  <td className="px-4 py-2 font-bold">{fmtDate(d.date)}</td>
                  <td className="px-4 py-2 text-right">{d.count}</td>
                  <td className="px-4 py-2 text-right font-bold">{fmtMoney(d.commission)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {commissionView === "product" && (
        <div className="bg-white border border-slate-200 overflow-x-auto mb-8">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-slate-200">
              <th className="px-4 py-2">Product / Rule Source</th><th className="px-4 py-2 text-right">Commission</th>
            </tr></thead>
            <tbody>
              {productWise.length === 0 && <tr><td colSpan={2} className="px-4 py-6 text-center text-slate-400">Koi record nahi.</td></tr>}
              {productWise.map((p) => (
                <tr key={p.source} className="border-t border-slate-100">
                  <td className="px-4 py-2 font-bold">{p.source}</td>
                  <td className="px-4 py-2 text-right font-bold">{fmtMoney(p.commission)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {commissionView === "customer" && (
        <div className="bg-white border border-slate-200 overflow-x-auto mb-8">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-slate-200">
              <th className="px-4 py-2">Customer</th><th className="px-4 py-2 text-right">Transactions</th><th className="px-4 py-2 text-right">Commission</th>
            </tr></thead>
            <tbody>
              {customerWise.length === 0 && <tr><td colSpan={3} className="px-4 py-6 text-center text-slate-400">Koi record nahi.</td></tr>}
              {customerWise.map((c) => (
                <tr key={c.customerId} className="border-t border-slate-100">
                  <td className="px-4 py-2 font-bold">{c.customerName}</td>
                  <td className="px-4 py-2 text-right">{c.count}</td>
                  <td className="px-4 py-2 text-right font-bold">{fmtMoney(c.commission)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ---------------- Sales Assistant ---------------- */

function SalesAssistant({ customers }) {
  const [customerId, setCustomerId] = useState(customers[0]?.id || "");
  const [language, setLanguage] = useState("en");
  const customer = customers.find((c) => c.id === customerId);
  const [copied, setCopied] = useState(false);

  const message = customer
    ? (MESSAGE_TEMPLATES[language][customer.audienceType] || MESSAGE_TEMPLATES[language].Builder)(customer.name, 0)
    : "";

  function copyText() {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div>
      <h2 className="text-xl font-black uppercase tracking-tight mb-4">Sales Assistant</h2>
      <div className="text-xs text-slate-400 mb-4 max-w-2xl">
        Customer ke audience type ke hisaab se ek ready WhatsApp message generate karein — Builder, Contractor, Developer, ya Housing Society.
      </div>
      <div className="bg-white border border-slate-200 p-4 max-w-xl">
        <Field label="Customer">
          <select className={inputCls} value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.audienceType})</option>)}
          </select>
        </Field>
        <Field label="Language">
          <div className="flex gap-2">
            <button type="button" onClick={() => setLanguage("en")} className={`flex-1 px-3 py-2 text-sm font-bold uppercase border ${language === "en" ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-300"}`}>English</button>
            <button type="button" onClick={() => setLanguage("ur")} className={`flex-1 px-3 py-2 text-sm font-bold uppercase border ${language === "ur" ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-300"}`}>Roman Urdu</button>
          </div>
        </Field>
        <Field label="Generated Message">
          <textarea readOnly className={`${inputCls} h-40`} value={message} />
        </Field>
        <div className="flex gap-2">
          <Btn onClick={copyText}>{copied ? "Copied!" : "Copy Text"}</Btn>
          {customer?.phone && (
            <a href={waLink(customer.phone, message)} target="_blank" rel="noreferrer"><Btn variant="dark">Send on WhatsApp</Btn></a>
          )}
        </div>
        {customer && !customer.phone && (
          <div className="text-xs text-red-600 mt-2">Is customer ka phone number nahi hai — WhatsApp link kaam nahi karega jab tak add na karein.</div>
        )}
      </div>
    </div>
  );
}

/* ---------------- Cement Estimator ---------------- */

function CementEstimator({ settings }) {
  const [width, setWidth] = useState(20);
  const [length, setLength] = useState(40);
  const [floors, setFloors] = useState(1);
  const [rate, setRate] = useState(1500);

  const coveredArea = width * length * floors;
  // Rough rule-of-thumb estimator: ~0.4 bags of cement per sq.ft of covered area.
  const bagsNeeded = Math.ceil(coveredArea * 0.4);
  const estimatedCost = bagsNeeded * rate;

  return (
    <div>
      <h2 className="text-xl font-black uppercase tracking-tight mb-4">Cement Estimator</h2>
      <div className="bg-white border border-slate-200 p-4 max-w-md">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Width (ft)"><input type="number" className={inputCls} value={width} onChange={(e) => setWidth(Number(e.target.value))} /></Field>
          <Field label="Length (ft)"><input type="number" className={inputCls} value={length} onChange={(e) => setLength(Number(e.target.value))} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Floors"><input type="number" className={inputCls} value={floors} onChange={(e) => setFloors(Number(e.target.value))} /></Field>
          <Field label="Cement Rate (Rs/bag)"><input type="number" className={inputCls} value={rate} onChange={(e) => setRate(Number(e.target.value))} /></Field>
        </div>
        <div className="bg-slate-50 border border-slate-200 p-3 mt-2 text-sm space-y-1">
          <div className="flex justify-between"><span>Covered Area</span><span className="font-bold">{coveredArea.toLocaleString()} Sq.Ft</span></div>
          <div className="flex justify-between"><span>Estimated Bags Needed</span><span className="font-bold">{bagsNeeded.toLocaleString()} Bags</span></div>
          <div className="flex justify-between border-t border-slate-300 pt-1"><span className="font-bold">Estimated Cost</span><span className="font-black text-blue-700">{fmtMoney(estimatedCost)}</span></div>
        </div>
        <div className="text-[10px] text-slate-400 mt-2">Ye sirf ek rough estimate hai — actual requirement structure design par depend karti hai.</div>
      </div>
    </div>
  );
}

/* ---------------- Customer Portal ---------------- */

function CustomerPortal({ currentUser, customers, invoices, payments, returns, exchanges, promises, transfers, adjustments, offers, settings }) {
  const customer = customers.find((c) => c.id === currentUser.id);
  const [viewingInvoice, setViewingInvoice] = useState(null);
  if (!customer) return <div className="p-6 text-slate-400">Account nahi mila, admin se rabta karein.</div>;

  const { entries, outstanding } = computeLedgerForCustomer(customer, invoices, payments, returns, exchanges, promises, transfers, adjustments);
  const myInvoices = invoices.filter((i) => i.customerId === customer.id).sort((a, b) => new Date(b.date) - new Date(a.date));
  const activeOffers = offers.filter((o) => o.active);

  return (
    <div className="min-h-screen bg-slate-100">
      {activeOffers.length > 0 && (
        <div className="bg-blue-700 text-white text-sm font-bold overflow-hidden whitespace-nowrap">
          <div className="inline-block py-2 px-4 animate-pulse">{activeOffers.map((o) => o.text).join("   ·   ")}</div>
        </div>
      )}
      <div className="max-w-3xl mx-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Portal</div>
            <div className="text-xl font-black uppercase tracking-tight text-slate-900">Welcome, {customer.name}</div>
          </div>
          {settings.logoUrl && <img src={settings.logoUrl} alt="Logo" className="w-10 h-10 object-contain" />}
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <Stat label="Outstanding Balance" value={fmtMoney(outstanding)} accent={outstanding > 0 ? "text-red-600" : "text-emerald-600"} />
          <Stat label="Total Invoices" value={myInvoices.length} />
        </div>

        <div className="bg-white border border-slate-200 overflow-x-auto mb-6">
          <div className="px-4 py-2.5 border-b border-slate-200 font-black uppercase text-xs tracking-wide text-slate-500">My Invoices</div>
          <table className="w-full text-sm">
            <tbody>
              {myInvoices.length === 0 && <tr><td className="px-4 py-6 text-center text-slate-400">Koi invoice nahi.</td></tr>}
              {myInvoices.map((inv) => (
                <tr key={inv.id} className="border-t border-slate-100 cursor-pointer hover:bg-slate-50" onClick={() => setViewingInvoice(inv)}>
                  <td className="px-4 py-2 font-bold text-blue-700">{inv.number}</td>
                  <td className="px-4 py-2 text-slate-500">{fmtDate(inv.date)}</td>
                  <td className="px-4 py-2 text-right font-bold">{fmtMoney(inv.total)}</td>
                  <td className="px-4 py-2 text-right">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 ${inv.status === "Paid" ? "bg-emerald-100 text-emerald-700" : inv.status === "Partial" ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"}`}>{inv.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white border border-slate-200 overflow-x-auto">
          <div className="px-4 py-2.5 border-b border-slate-200 font-black uppercase text-xs tracking-wide text-slate-500">My Ledger</div>
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-t border-slate-100 bg-slate-50">
                <td className="px-4 py-2 text-slate-500" colSpan={2}>Opening Balance</td>
                <td className="px-4 py-2 text-right font-bold" colSpan={2}>{fmtMoney(customer.openingBalance || 0)}</td>
              </tr>
              {entries.map((e) => (
                <tr key={e.id} className="border-t border-slate-100">
                  <td className="px-4 py-2">{fmtDate(e.date)}</td>
                  <td className="px-4 py-2 text-slate-500">{e.type}</td>
                  <td className="px-4 py-2 text-right text-red-600">{e.debit ? fmtMoney(e.debit) : ""}</td>
                  <td className="px-4 py-2 text-right text-emerald-600">{e.credit ? fmtMoney(e.credit) : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {viewingInvoice && (
        <InvoiceDetail invoice={viewingInvoice} settings={settings} returns={returns} exchanges={exchanges} onClose={() => setViewingInvoice(null)} />
      )}
    </div>
  );
}

/* ---------------- Settings ---------------- */

function Settings({ settings, saveSettings, users, saveUser, deleteUser, branches, saveBranch, deleteBranch, onRestoreBackup, exportBackup }) {
  const [form, setForm] = useState(settings);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({ username: "", password: "", role: "staff", name: "", branchId: "" });
  const [showBranchForm, setShowBranchForm] = useState(false);
  const [branchName, setBranchName] = useState("");
  const fileInputRef = React.useRef(null);
  const restoreInputRef = React.useRef(null);

  function saveCompanyInfo() {
    saveSettings(form);
    alert("Settings saved.");
  }

  async function handleLogoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { alert("Sirf image file (PNG/JPG) upload karein."); return; }
    try {
      const dataUrl = await resizeImageToDataUrl(file, 300);
      const next = { ...form, logoUrl: dataUrl };
      setForm(next);
      saveSettings(next);
    } catch { alert("Logo upload nahi ho saka, dobara try karein."); }
  }

  function openNewUser() { setEditingUser(null); setUserForm({ username: "", password: "", role: "staff", name: "", branchId: "" }); setShowUserForm(true); }
  function openEditUser(u) { setEditingUser(u); setUserForm(u); setShowUserForm(true); }
  function submitUser() {
    if (!userForm.username.trim() || !userForm.password.trim()) { alert("Username aur password zaroori hai."); return; }
    if (editingUser) saveUser({ ...editingUser, ...userForm });
    else saveUser({ id: uid("u"), ...userForm });
    setShowUserForm(false);
  }

  function submitBranch() {
    if (!branchName.trim()) return;
    saveBranch({ id: uid("branch"), name: branchName.trim() });
    setBranchName(""); setShowBranchForm(false);
  }

  function handleRestoreFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!data || typeof data !== "object") throw new Error("invalid");
        onRestoreBackup(data);
        alert("Backup restore ho gaya.");
      } catch {
        alert("Ye file valid backup nahi hai.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  return (
    <div>
      <h2 className="text-xl font-black uppercase tracking-tight mb-4">Settings</h2>

      <div className="bg-white border border-slate-200 p-4 max-w-xl mb-6">
        <div className="text-[11px] uppercase tracking-wide font-bold text-slate-500 mb-3">Company Info</div>
        <Field label="Company Logo">
          <div className="flex items-center gap-3">
            {form.logoUrl && <img src={form.logoUrl} alt="Logo" className="w-14 h-14 object-contain border border-slate-200" />}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="text-xs" />
            {form.logoUrl && <button type="button" className="text-xs font-bold text-red-600" onClick={() => { const next = { ...form, logoUrl: "" }; setForm(next); saveSettings(next); }}>Remove</button>}
          </div>
        </Field>
        <Field label="Company Name"><input className={inputCls} value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} /></Field>
        <Field label="Address"><input className={inputCls} value={form.companyAddress} onChange={(e) => setForm({ ...form, companyAddress: e.target.value })} /></Field>
        <Field label="Phone"><input className={inputCls} value={form.companyPhone} onChange={(e) => setForm({ ...form, companyPhone: e.target.value })} /></Field>
        <Btn onClick={saveCompanyInfo}>Save</Btn>
      </div>

      <div className="bg-white border border-slate-200 p-4 max-w-xl mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[11px] uppercase tracking-wide font-bold text-slate-500">Branches</div>
          <Btn small onClick={() => setShowBranchForm(true)}>Add Branch</Btn>
        </div>
        {branches.length === 0 && <div className="text-slate-400 text-sm">Koi branch nahi bani.</div>}
        <div className="divide-y divide-slate-100">
          {branches.map((b) => (
            <div key={b.id} className="py-2 flex items-center justify-between text-sm">
              <span className="font-bold">{b.name}</span>
              {b.id !== "branch_main" && (
                <button className="text-xs font-bold text-slate-500 hover:text-red-600" onClick={() => { if (confirm(`Delete branch ${b.name}?`)) deleteBranch(b.id); }}>Delete</button>
              )}
            </div>
          ))}
        </div>
        {showBranchForm && (
          <div className="flex gap-2 mt-3">
            <input className={inputCls} placeholder="Branch name" value={branchName} onChange={(e) => setBranchName(e.target.value)} />
            <Btn small onClick={submitBranch}>Save</Btn>
            <Btn small variant="ghost" onClick={() => setShowBranchForm(false)}>Cancel</Btn>
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-200 p-4 max-w-xl mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[11px] uppercase tracking-wide font-bold text-slate-500">Users (Admin / Staff)</div>
          <Btn small onClick={openNewUser}>+ Add User</Btn>
        </div>
        <div className="divide-y divide-slate-100">
          {users.map((u) => (
            <div key={u.id} className="py-2 flex items-center justify-between text-sm">
              <div>
                <span className="font-bold">{u.name || u.username}</span>{" "}
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-slate-100 text-slate-600 ml-1">{u.role}</span>
                {u.branchId && <span className="text-slate-400 text-xs ml-2">{branches.find((b) => b.id === u.branchId)?.name}</span>}
              </div>
              <div>
                <button className="text-xs font-bold text-slate-500 hover:text-blue-700 mr-3" onClick={() => openEditUser(u)}>Edit</button>
                <button className="text-xs font-bold text-slate-500 hover:text-red-600" onClick={() => { if (confirm(`Delete user ${u.username}?`)) deleteUser(u.id); }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
        {showUserForm && (
          <div className="mt-3 border-t border-slate-200 pt-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Username"><input className={inputCls} value={userForm.username} onChange={(e) => setUserForm({ ...userForm, username: e.target.value })} /></Field>
              <Field label="Password"><input className={inputCls} value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} /></Field>
            </div>
            <Field label="Full name"><input className={inputCls} value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Role">
                <select className={inputCls} value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}>
                  <option value="admin">Admin</option><option value="staff">Staff</option>
                </select>
              </Field>
              <Field label="Branch">
                <select className={inputCls} value={userForm.branchId || ""} onChange={(e) => setUserForm({ ...userForm, branchId: e.target.value })}>
                  <option value="">All Branches</option>
                  {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </Field>
            </div>
            <div className="flex gap-2"><Btn onClick={submitUser}>Save</Btn><Btn variant="ghost" onClick={() => setShowUserForm(false)}>Cancel</Btn></div>
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-200 p-4 max-w-xl mb-6">
        <div className="text-[11px] uppercase tracking-wide font-bold text-slate-500 mb-3">Backup</div>
        <div className="flex gap-2">
          <Btn onClick={exportBackup}>Download Backup (JSON)</Btn>
          <Btn variant="ghost" onClick={() => restoreInputRef.current?.click()}>Restore from File</Btn>
          <input ref={restoreInputRef} type="file" accept="application/json" onChange={handleRestoreFile} className="hidden" />
        </div>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <span className="text-[11px] uppercase tracking-wide font-bold text-slate-500">Language</span>
        <LanguageSwitcher />
      </div>
    </div>
  );
}

/* ==================== Root App Component ==================== */

function App() {
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [prefill, setPrefill] = useState(null);
  const [focusCustomerId, setFocusCustomerId] = useState(null);
  const [focusInvoiceId, setFocusInvoiceId] = useState(null);
  const [focusPromiseId, setFocusPromiseId] = useState(null);

  const [users, setUsers] = useState(DEFAULT_USERS);
  const [customers, setCustomers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [returns, setReturns] = useState([]);
  const [exchanges, setExchanges] = useState([]);
  const [creditNotes, setCreditNotes] = useState([]);
  const [promises, setPromises] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [adjustments, setAdjustments] = useState([]);
  const [leads, setLeads] = useState([]);
  const [products, setProducts] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [offers, setOffers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [branches, setBranches] = useState(DEFAULT_BRANCHES);
  const [auditLog, setAuditLog] = useState([]);

  // Commission Management System state (additive; never modifies invoice/
  // customer/payment tables above).
  const [commissionAgents, setCommissionAgents] = useState([]);
  const [commissionRules, setCommissionRules] = useState([]);
  const [commissionTransactions, setCommissionTransactions] = useState([]);
  const [commissionPayments, setCommissionPayments] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [
        u, c, inv, pay, ret, exch, cn, prom, tr, adj,
        ld, prod, drv, off, bk, ord, set, br, aud,
        cAgents, cRules, cTxns, cPays,
      ] = await Promise.all([
        storeGet("ct-users", DEFAULT_USERS),
        storeGet("ct-customers", []),
        storeGet("ct-invoices", []),
        storeGet("ct-payments", []),
        storeGet("ct-returns", []),
        storeGet("ct-exchanges", []),
        storeGet("ct-creditnotes", []),
        storeGet("ct-promises", []),
        storeGet("ct-transfers", []),
        storeGet("ct-adjustments", []),
        storeGet("ct-leads", []),
        storeGet("ct-products", []),
        storeGet("ct-drivers", []),
        storeGet("ct-offers", []),
        storeGet("ct-bookings", []),
        storeGet("ct-orders", []),
        storeGet("ct-settings", DEFAULT_SETTINGS),
        storeGet("ct-branches", DEFAULT_BRANCHES),
        storeGet("ct-auditlog", []),
        storeGet("ct-commissionagents", []),
        storeGet("ct-commissionrules", []),
        storeGet("ct-commissiontransactions", []),
        storeGet("ct-commissionpayments", []),
      ]);
      if (cancelled) return;
      setUsers(u); setCustomers(c); setInvoices(inv); setPayments(pay); setReturns(ret);
      setExchanges(exch); setCreditNotes(cn); setPromises(prom); setTransfers(tr); setAdjustments(adj);
      setLeads(ld); setProducts(prod); setDrivers(drv); setOffers(off); setBookings(bk); setOrders(ord);
      setSettings({ ...DEFAULT_SETTINGS, ...set }); setBranches(br); setAuditLog(aud);
      setCommissionAgents(cAgents); setCommissionRules(cRules); setCommissionTransactions(cTxns); setCommissionPayments(cPays);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  // Supabase realtime — when configured, keeps every connected device in
  // sync live. Falls back to purely local state when Supabase isn't set up.
  useEffect(() => {
    if (!supabase) return;
    const setterByKey = {
      "ct-users": setUsers, "ct-customers": setCustomers, "ct-invoices": setInvoices, "ct-payments": setPayments,
      "ct-returns": setReturns, "ct-exchanges": setExchanges, "ct-creditnotes": setCreditNotes, "ct-promises": setPromises,
      "ct-transfers": setTransfers, "ct-adjustments": setAdjustments, "ct-leads": setLeads, "ct-products": setProducts,
      "ct-drivers": setDrivers, "ct-offers": setOffers, "ct-bookings": setBookings, "ct-orders": setOrders,
      "ct-settings": (v) => setSettings({ ...DEFAULT_SETTINGS, ...v }), "ct-branches": setBranches, "ct-auditlog": setAuditLog,
      "ct-commissionagents": setCommissionAgents, "ct-commissionrules": setCommissionRules,
      "ct-commissiontransactions": setCommissionTransactions, "ct-commissionpayments": setCommissionPayments,
    };
    const channel = supabase
      .channel("kv_store_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "kv_store" }, (payload) => {
        const row = payload.new || payload.old;
        if (!row) return;
        const setter = setterByKey[row.key];
        if (setter && payload.new) setter(payload.new.value);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const persist = {
    users: (v) => { setUsers(v); storeSet("ct-users", v); },
    customers: (v) => { setCustomers(v); storeSet("ct-customers", v); },
    invoices: (v) => { setInvoices(v); storeSet("ct-invoices", v); },
    payments: (v) => { setPayments(v); storeSet("ct-payments", v); },
    returns: (v) => { setReturns(v); storeSet("ct-returns", v); },
    exchanges: (v) => { setExchanges(v); storeSet("ct-exchanges", v); },
    creditNotes: (v) => { setCreditNotes(v); storeSet("ct-creditnotes", v); },
    promises: (v) => { setPromises(v); storeSet("ct-promises", v); },
    transfers: (v) => { setTransfers(v); storeSet("ct-transfers", v); },
    adjustments: (v) => { setAdjustments(v); storeSet("ct-adjustments", v); },
    leads: (v) => { setLeads(v); storeSet("ct-leads", v); },
    products: (v) => { setProducts(v); storeSet("ct-products", v); },
    drivers: (v) => { setDrivers(v); storeSet("ct-drivers", v); },
    offers: (v) => { setOffers(v); storeSet("ct-offers", v); },
    bookings: (v) => { setBookings(v); storeSet("ct-bookings", v); },
    orders: (v) => { setOrders(v); storeSet("ct-orders", v); },
    settings: (v) => { setSettings(v); storeSet("ct-settings", v); },
    branches: (v) => { setBranches(v); storeSet("ct-branches", v); },
    auditLog: (v) => { setAuditLog(v); storeSet("ct-auditlog", v); },
    commissionAgents: (v) => { setCommissionAgents(v); storeSet("ct-commissionagents", v); },
    commissionRules: (v) => { setCommissionRules(v); storeSet("ct-commissionrules", v); },
    commissionTransactions: (v) => { setCommissionTransactions(v); storeSet("ct-commissiontransactions", v); },
    commissionPayments: (v) => { setCommissionPayments(v); storeSet("ct-commissionpayments", v); },
  };

  function logAudit(action, reference, reason) {
    setAuditLog((prev) => {
      const next = [...prev, {
        id: uid("aud"), action, reference, reason: reason || "",
        user: currentUser?.name || currentUser?.username || "System", at: new Date().toISOString(),
      }];
      storeSet("ct-auditlog", next);
      return next;
    });
  }

  /* ---------- Customers ---------- */
  function saveCustomer(data) {
    const exists = customers.some((c) => c.id === data.id);
    persist.customers(exists ? customers.map((c) => (c.id === data.id ? data : c)) : [...customers, data]);
    logAudit(exists ? "Customer Updated" : "Customer Created", data.name, "");
  }
  function deleteCustomer(id) {
    persist.customers(customers.filter((c) => c.id !== id));
  }
  function openLedger(customerId) { setFocusCustomerId(customerId); setPage("ledger"); }

  /* ---------- Commission helpers (defined before invoice handlers that call them) ---------- */
  function nextCommissionAgentCode() {
    return "COM-" + String(settings.commissionAgentCounter || 1).padStart(4, "0");
  }

  function syncCommissionForInvoice(inv) {
    const existing = commissionTransactions.find((tx) => tx.invoiceId === inv.id && tx.status !== "Cancelled");
    if (!inv.commissionAgentId) {
      if (existing) {
        const updated = { ...existing, status: "Cancelled", remainingAmount: 0, cancelReason: "Commission agent removed from invoice" };
        persist.commissionTransactions(commissionTransactions.map((t) => (t.id === existing.id ? updated : t)));
        logAudit("Commission Cancelled", `${existing.invoiceNumber} — ${existing.agentName}`, "Commission agent removed from invoice");
      }
      return;
    }
    const agent = commissionAgents.find((a) => a.id === inv.commissionAgentId);
    if (!agent) return;
    const { total, lines } = computeCommissionForInvoice(agent, commissionRules, inv.items, inv.date, inv.subtotal);
    if (existing && existing.agentId === agent.id) {
      const paid = Number(existing.paidAmount) || 0;
      const remaining = Math.max(0, roundMoney(total - paid));
      const updated = {
        ...existing, saleAmount: inv.subtotal, commissionAmount: total, breakdown: lines,
        remainingAmount: remaining,
        commissionType: lines.length === 1 ? lines[0].commissionType : "mixed",
        commissionRate: lines.length === 1 ? lines[0].commissionRate : 0,
        status: existing.status === "Paid" && remaining > 0 ? "Approved" : existing.status,
      };
      persist.commissionTransactions(commissionTransactions.map((t) => (t.id === existing.id ? updated : t)));
      return;
    }
    let workingList = commissionTransactions;
    if (existing) {
      const cancelled = { ...existing, status: "Cancelled", remainingAmount: 0, cancelReason: "Commission agent changed on invoice" };
      workingList = workingList.map((t) => (t.id === existing.id ? cancelled : t));
      logAudit("Commission Cancelled", `${existing.invoiceNumber} — ${existing.agentName}`, "Commission agent changed on invoice");
    }
    if (total > 0) {
      const tx = {
        id: uid("ctx"), agentId: agent.id, agentName: agent.name,
        invoiceId: inv.id, invoiceNumber: inv.number, customerId: inv.customerId, customerName: inv.customerName,
        invoiceDate: inv.date, saleAmount: inv.subtotal,
        commissionType: lines.length === 1 ? lines[0].commissionType : "mixed",
        commissionRate: lines.length === 1 ? lines[0].commissionRate : 0,
        commissionAmount: total, breakdown: lines, paidAmount: 0, remainingAmount: total,
        status: "Pending", createdAt: new Date().toISOString(),
      };
      workingList = [...workingList, tx];
      logAudit("Commission Created", `${tx.invoiceNumber} — ${agent.name}`, `Commission ${fmtMoney(total)} generated`);
    }
    persist.commissionTransactions(workingList);
  }

  function recalcCommissionAfterReturnOrExchange(invoiceId, nextReturns, nextExchanges) {
    const inv = invoices.find((i) => i.id === invoiceId);
    if (!inv || !inv.commissionAgentId) return;
    const existing = commissionTransactions.find((tx) => tx.invoiceId === invoiceId && tx.status !== "Cancelled");
    if (!existing) return;
    const agent = commissionAgents.find((a) => a.id === inv.commissionAgentId);
    if (!agent) return;
    const { total, lines } = recalculatedCommissionAmount(agent, commissionRules, inv, nextReturns, nextExchanges);
    const paid = Number(existing.paidAmount) || 0;
    const remaining = Math.max(0, roundMoney(total - paid));
    const updated = {
      ...existing, commissionAmount: total, breakdown: lines, remainingAmount: remaining,
      status: existing.status === "Paid" && remaining > 0 ? "Approved" : existing.status,
    };
    persist.commissionTransactions(commissionTransactions.map((t) => (t.id === existing.id ? updated : t)));
    logAudit("Commission Adjusted", `${existing.invoiceNumber} — ${agent.name}`, "Recalculated after return/exchange");
  }

  /* ---------- Invoices ---------- */
  function saveInvoice(inv) {
    persist.invoices([...invoices, inv]);
    persist.settings({ ...settings, invoiceCounter: settings.invoiceCounter + 1 });
    if (inv.paymentReceived > 0) {
      persist.payments([...payments, {
        id: uid("pay"), customerId: inv.customerId, customerName: inv.customerName, date: inv.date,
        amount: inv.paymentReceived, method: "Cash", note: `Against ${inv.number}`, invoiceId: inv.id, branchId: inv.branchId || "",
      }]);
    }
    syncCommissionForInvoice(inv);
    logAudit("Invoice Created", inv.number, "");
  }

  function updateInvoice(inv, original) {
    const editEntry = {
      action: "Edited", editedBy: currentUser?.name || currentUser?.username, editedAt: new Date().toISOString(),
      previousValues: { total: original.total, status: original.status },
      newValues: { total: inv.total, status: inv.status },
    };
    const finalInv = { ...inv, editHistory: [...(original.editHistory || []), editEntry] };
    persist.invoices(invoices.map((i) => (i.id === inv.id ? finalInv : i)));
    const linkedPayment = payments.find((p) => p.invoiceId === inv.id || p.note === `Against ${original.number}`);
    if (inv.paymentReceived !== original.paymentReceived) {
      if (linkedPayment) {
        persist.payments(payments.map((p) => (p === linkedPayment ? { ...p, amount: inv.paymentReceived, invoiceId: inv.id, note: `Against ${inv.number}` } : p)));
      } else if (inv.paymentReceived > 0) {
        persist.payments([...payments, { id: uid("pay"), customerId: inv.customerId, customerName: inv.customerName, date: inv.date, amount: inv.paymentReceived, method: "Cash", note: `Against ${inv.number}`, invoiceId: inv.id, branchId: inv.branchId || "" }]);
      }
    }
    syncCommissionForInvoice(finalInv);
    logAudit("Invoice Edited", inv.number, "");
  }

  function cancelInvoiceFn(inv) {
    const editEntry = { action: "Cancelled", editedBy: currentUser?.name || currentUser?.username, editedAt: new Date().toISOString() };
    const updated = { ...inv, docStatus: "Cancelled", editHistory: [...(inv.editHistory || []), editEntry] };
    persist.invoices(invoices.map((i) => (i.id === inv.id ? updated : i)));
    const linkedTx = commissionTransactions.find((tx) => tx.invoiceId === inv.id && tx.status !== "Cancelled");
    if (linkedTx) {
      const updatedTx = { ...linkedTx, status: "Cancelled", remainingAmount: 0, cancelReason: "Invoice cancelled" };
      persist.commissionTransactions(commissionTransactions.map((t) => (t.id === linkedTx.id ? updatedTx : t)));
      logAudit("Commission Cancelled", `${linkedTx.invoiceNumber} — ${linkedTx.agentName}`, "Invoice cancelled");
    }
    logAudit("Invoice Cancelled", inv.number, "");
  }

  function savePayment(p) {
    persist.payments([...payments, p]);
    if (p.promiseId) {
      const promise = promises.find((pr) => pr.id === p.promiseId);
      if (promise) {
        const nextPaid = roundMoney((Number(promise.paidAmount) || 0) + p.amount);
        persist.promises(promises.map((pr) => (pr.id === promise.id ? { ...pr, paidAmount: nextPaid } : pr)));
      }
    }
    logAudit("Payment Recorded", p.customerName, fmtMoney(p.amount));
  }

  /* ---------- Sales Return / Exchange ---------- */
  function onCreateReturn(data) {
    const returnCode = "RET-" + String(settings.returnCounter).padStart(4, "0");
    const record = { id: uid("ret"), code: returnCode, status: "Active", ...data };
    const nextReturns = [...returns, record];
    persist.returns(nextReturns);

    const cnNumber = "CN-" + String(settings.creditNoteCounter).padStart(4, "0");
    const cn = { id: uid("cn"), number: cnNumber, date: data.date, customerId: data.customerId, customerName: data.customerName, amount: data.amount, reason: data.reason, status: "Active", linkedInvoiceNumber: "", returnId: record.id };
    persist.creditNotes([...creditNotes, cn]);

    persist.settings({ ...settings, returnCounter: settings.returnCounter + 1, creditNoteCounter: settings.creditNoteCounter + 1 });

    recalcCommissionAfterReturnOrExchange(data.invoiceId, nextReturns, exchanges);
    logAudit("Sales Return", returnCode, data.reason);
  }

  function onDeleteReturn(record, reason) {
    const updated = { ...record, status: "Deleted", deleteReason: reason };
    const nextReturns = returns.map((r) => (r.id === record.id ? updated : r));
    persist.returns(nextReturns);
    const linkedCn = creditNotes.find((cn) => cn.returnId === record.id);
    if (linkedCn) persist.creditNotes(creditNotes.map((cn) => (cn.id === linkedCn.id ? { ...cn, status: "Reversed" } : cn)));
    recalcCommissionAfterReturnOrExchange(record.invoiceId, nextReturns, exchanges);
    logAudit("Sales Return Deleted", record.code, reason);
  }

  function onCreateExchange(data) {
    const code = "EX-" + String(settings.exchangeCounter).padStart(4, "0");
    const record = { id: uid("ex"), code, status: "Active", ...data };
    const nextExchanges = [...exchanges, record];
    persist.exchanges(nextExchanges);
    persist.settings({ ...settings, exchangeCounter: settings.exchangeCounter + 1 });
    recalcCommissionAfterReturnOrExchange(data.invoiceId, returns, nextExchanges);
    logAudit("Exchange", code, data.reason);
  }

  function onDeleteExchange(record, reason) {
    const updated = { ...record, status: "Deleted", deleteReason: reason };
    const nextExchanges = exchanges.map((ex) => (ex.id === record.id ? updated : ex));
    persist.exchanges(nextExchanges);
    recalcCommissionAfterReturnOrExchange(record.invoiceId, returns, nextExchanges);
    logAudit("Exchange Deleted", record.code, reason);
  }

  function onLinkCreditNoteInvoice(cnId, invoiceNumber) {
    persist.creditNotes(creditNotes.map((cn) => (cn.id === cnId ? { ...cn, linkedInvoiceNumber: invoiceNumber } : cn)));
  }

  /* ---------- Outstanding Transfer / Adjustments ---------- */
  function onCreateTransfer(data) {
    const code = "OT-" + String(settings.transferCounter).padStart(4, "0");
    const record = { id: uid("tr"), code, date: todayISO(), status: "Active", createdBy: currentUser?.name || currentUser?.username, ...data };
    persist.transfers([...transfers, record]);
    persist.settings({ ...settings, transferCounter: settings.transferCounter + 1 });
    logAudit("Outstanding Transfer", code, data.reason);
  }
  function onReverseTransfer(record, reason) {
    persist.transfers(transfers.map((t) => (t.id === record.id ? { ...t, status: "Reversed", reverseReason: reason } : t)));
    logAudit("Outstanding Transfer Reversed", record.code, reason);
  }

  function onCreateAdjustment(data) {
    const code = "ADJ-" + String(settings.adjustmentCounter).padStart(4, "0");
    const record = { id: uid("adj"), code, status: "Active", createdBy: currentUser?.name || currentUser?.username, ...data };
    persist.adjustments([...adjustments, record]);
    persist.settings({ ...settings, adjustmentCounter: settings.adjustmentCounter + 1 });
    logAudit("Adjustment Created", code, data.reason);
  }
  function onUpdateAdjustment(original, data) {
    persist.adjustments(adjustments.map((a) => (a.id === original.id ? { ...original, ...data } : a)));
    logAudit("Adjustment Updated", original.code, data.reason);
  }
  function onReverseAdjustment(record, reason) {
    persist.adjustments(adjustments.map((a) => (a.id === record.id ? { ...a, status: "Reversed", reverseReason: reason } : a)));
    logAudit("Adjustment Reversed", record.code, reason);
  }

  /* ---------- Promise To Pay ---------- */
  function onCreatePromise(data) {
    const code = "PTP-" + String(settings.promiseCounter).padStart(4, "0");
    const record = { id: uid("ptp"), code, status: "Pending", paidAmount: 0, ...data };
    persist.promises([...promises, record]);
    persist.settings({ ...settings, promiseCounter: settings.promiseCounter + 1 });
    logAudit("Promise Created", code, fmtMoney(data.amount));
  }
  function onUpdatePromise(original, data) {
    persist.promises(promises.map((p) => (p.id === original.id ? { ...original, ...data } : p)));
    logAudit("Promise Updated", original.code, "");
  }
  function onCancelPromise(record, reason) {
    persist.promises(promises.map((p) => (p.id === record.id ? { ...p, status: "Cancelled", cancelReason: reason } : p)));
    logAudit("Promise Cancelled", record.code, reason);
  }

  /* ---------- Bookings / Orders ---------- */
  function onCreateAdvanceBooking(data) {
    const code = "BK-" + String(settings.bookingCounter).padStart(4, "0");
    const record = { id: uid("bk"), code, status: "Booked", expiryDate: addOneMonth(data.date), ...data };
    persist.bookings([...bookings, record]);
    persist.settings({ ...settings, bookingCounter: settings.bookingCounter + 1 });
    logAudit("Advance Booking Created", code, "");
  }
  function saveBooking(b) { persist.bookings(bookings.map((x) => (x.id === b.id ? b : x))); }
  function onBookingFulfilled(id) { persist.bookings(bookings.map((b) => (b.id === id ? { ...b, status: "Completed" } : b))); }

  function onCreateOrder(data) {
    const code = "ORD-" + String(settings.orderCounter).padStart(4, "0");
    const record = { id: uid("ord"), code, status: "Pending", ...data };
    persist.orders([...orders, record]);
    persist.settings({ ...settings, orderCounter: settings.orderCounter + 1 });
    logAudit("Order Created", code, "");
  }
  function saveOrder(o) { persist.orders(orders.map((x) => (x.id === o.id ? o : x))); }
  function onOrderFulfilled(id) { persist.orders(orders.map((o) => (o.id === id ? { ...o, status: "Completed" } : o))); }

  function convertBookingToInvoice(b) {
    setPrefill({ sourceType: "booking", sourceId: b.id, sourceCode: b.code, customerId: b.customerId, productId: b.productId, productName: b.productName, unit: b.unit, qty: b.qty, rate: b.rate });
    setPage("invoices");
  }
  function convertOrderToInvoice(o) {
    const product = products.find((p) => p.id === o.productId);
    setPrefill({ sourceType: "order", sourceId: o.id, sourceCode: o.code, customerId: o.customerId, productId: o.productId, productName: o.productName, unit: o.unit, qty: o.qty, rate: product ? product.price : 0 });
    setPage("invoices");
  }

  /* ---------- Leads / Products / Drivers / Offers ---------- */
  function saveLead(l) {
    const exists = leads.some((x) => x.id === l.id);
    persist.leads(exists ? leads.map((x) => (x.id === l.id ? l : x)) : [...leads, l]);
  }
  function deleteLead(id) { persist.leads(leads.filter((l) => l.id !== id)); }

  function saveProduct(p) {
    const exists = products.some((x) => x.id === p.id);
    persist.products(exists ? products.map((x) => (x.id === p.id ? p : x)) : [...products, p]);
  }
  function deleteProduct(id) { persist.products(products.filter((p) => p.id !== id)); }

  function saveDriver(d) {
    const exists = drivers.some((x) => x.id === d.id);
    persist.drivers(exists ? drivers.map((x) => (x.id === d.id ? d : x)) : [...drivers, d]);
    if (!exists) persist.settings({ ...settings, driverCounter: settings.driverCounter + 1 });
  }
  function deleteDriver(id) { persist.drivers(drivers.filter((d) => d.id !== id)); }

  function saveOffer(o) {
    const exists = offers.some((x) => x.id === o.id);
    persist.offers(exists ? offers.map((x) => (x.id === o.id ? o : x)) : [...offers, o]);
  }
  function deleteOffer(id) { persist.offers(offers.filter((o) => o.id !== id)); }

  /* ---------- Branches / Users / Settings / Backup ---------- */
  function saveBranch(b) { persist.branches([...branches, b]); }
  function deleteBranch(id) { persist.branches(branches.filter((b) => b.id !== id)); }
  function saveUser(u) {
    const exists = users.some((x) => x.id === u.id);
    persist.users(exists ? users.map((x) => (x.id === u.id ? u : x)) : [...users, u]);
  }
  function deleteUser(id) { persist.users(users.filter((u) => u.id !== id)); }
  function onResetUsers() { persist.users(DEFAULT_USERS); }
  function saveSettings(s) { persist.settings(s); }

  function exportBackup() {
    const data = {
      users, customers, invoices, payments, returns, exchanges, creditNotes, promises, transfers, adjustments,
      leads, products, drivers, offers, bookings, orders, settings, branches, auditLog,
      commissionAgents, commissionRules, commissionTransactions, commissionPayments,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `chaudhary_traders_backup_${todayISO()}.json`; a.click();
    URL.revokeObjectURL(url);
  }
  function onRestoreBackup(data) {
    if (data.users) persist.users(data.users);
    if (data.customers) persist.customers(data.customers);
    if (data.invoices) persist.invoices(data.invoices);
    if (data.payments) persist.payments(data.payments);
    if (data.returns) persist.returns(data.returns);
    if (data.exchanges) persist.exchanges(data.exchanges);
    if (data.creditNotes) persist.creditNotes(data.creditNotes);
    if (data.promises) persist.promises(data.promises);
    if (data.transfers) persist.transfers(data.transfers);
    if (data.adjustments) persist.adjustments(data.adjustments);
    if (data.leads) persist.leads(data.leads);
    if (data.products) persist.products(data.products);
    if (data.drivers) persist.drivers(data.drivers);
    if (data.offers) persist.offers(data.offers);
    if (data.bookings) persist.bookings(data.bookings);
    if (data.orders) persist.orders(data.orders);
    if (data.settings) persist.settings({ ...DEFAULT_SETTINGS, ...data.settings });
    if (data.branches) persist.branches(data.branches);
    if (data.auditLog) persist.auditLog(data.auditLog);
    if (data.commissionAgents) persist.commissionAgents(data.commissionAgents);
    if (data.commissionRules) persist.commissionRules(data.commissionRules);
    if (data.commissionTransactions) persist.commissionTransactions(data.commissionTransactions);
    if (data.commissionPayments) persist.commissionPayments(data.commissionPayments);
  }

  /* ---------- Commission Management handlers ---------- */
  function createCommissionAgent(data) {
    const code = nextCommissionAgentCode();
    const agent = { id: code, ...data, createdAt: todayISO(), createdBy: currentUser?.name || currentUser?.username };
    persist.commissionAgents([...commissionAgents, agent]);
    persist.settings({ ...settings, commissionAgentCounter: (settings.commissionAgentCounter || 1) + 1 });
    logAudit("Commission Agent Created", agent.id, agent.name);
  }
  function updateCommissionAgent(original, data) {
    const updated = { ...original, ...data };
    persist.commissionAgents(commissionAgents.map((a) => (a.id === original.id ? updated : a)));
    logAudit("Commission Agent Updated", original.id, updated.name);
  }
  function toggleCommissionAgentStatus(agent) {
    const nextStatus = agent.status === "Active" ? "Inactive" : "Active";
    persist.commissionAgents(commissionAgents.map((a) => (a.id === agent.id ? { ...a, status: nextStatus } : a)));
    logAudit(nextStatus === "Active" ? "Commission Agent Activated" : "Commission Agent Deactivated", agent.id, agent.name);
  }

  function createCommissionRule(data) {
    const rule = { id: uid("crule"), ...data, createdAt: todayISO() };
    persist.commissionRules([...commissionRules, rule]);
    logAudit("Commission Rule Created", rule.agentId, `${rule.productMatch} — ${fmtCommissionRate(rule.commissionType, rule.commissionRate)}`);
  }
  function updateCommissionRule(original, data) {
    const updated = { ...original, ...data };
    persist.commissionRules(commissionRules.map((r) => (r.id === original.id ? updated : r)));
    logAudit("Commission Rule Updated", original.agentId, `${updated.productMatch} — ${fmtCommissionRate(updated.commissionType, updated.commissionRate)}`);
  }

  function approveCommissionTransaction(tx) {
    const updated = { ...tx, status: "Approved" };
    persist.commissionTransactions(commissionTransactions.map((t) => (t.id === tx.id ? updated : t)));
    logAudit("Commission Approved", `${tx.invoiceNumber} — ${tx.agentName}`, "");
  }
  function cancelCommissionTransaction(tx, reason) {
    const updated = { ...tx, status: "Cancelled", remainingAmount: 0, cancelReason: reason };
    persist.commissionTransactions(commissionTransactions.map((t) => (t.id === tx.id ? updated : t)));
    logAudit("Commission Cancelled", `${tx.invoiceNumber} — ${tx.agentName}`, reason);
  }

  function payCommissionTransaction(tx, data) {
    const paidAmount = roundMoney((Number(tx.paidAmount) || 0) + data.amount);
    const remainingAmount = Math.max(0, roundMoney(tx.commissionAmount - paidAmount));
    const updated = { ...tx, paidAmount, remainingAmount, status: remainingAmount <= 0 ? "Paid" : tx.status };
    persist.commissionTransactions(commissionTransactions.map((t) => (t.id === tx.id ? updated : t)));
    const payment = {
      id: uid("cpay"), agentId: tx.agentId, agentName: tx.agentName,
      date: data.date, amount: data.amount, method: data.method,
      referenceNumber: data.referenceNumber, notes: data.notes,
      allocations: [{ transactionId: tx.id, amount: data.amount }],
      createdBy: currentUser?.name || currentUser?.username, createdAt: new Date().toISOString(),
    };
    persist.commissionPayments([...commissionPayments, payment]);
    logAudit("Commission Paid", `${tx.invoiceNumber} — ${tx.agentName}`, fmtMoney(data.amount));
  }

  function payCommissionAgent(agent, data) {
    const eligible = commissionTransactions
      .filter((tx) => tx.agentId === agent.id && tx.status === "Approved" && tx.remainingAmount > 0)
      .sort((a, b) => new Date(a.invoiceDate) - new Date(b.invoiceDate));
    let amountLeft = data.amount;
    const allocations = [];
    const updates = {};
    for (const tx of eligible) {
      if (amountLeft <= 0) break;
      const applied = Math.min(amountLeft, tx.remainingAmount);
      const paidAmount = roundMoney((Number(tx.paidAmount) || 0) + applied);
      const remainingAmount = Math.max(0, roundMoney(tx.commissionAmount - paidAmount));
      updates[tx.id] = { ...tx, paidAmount, remainingAmount, status: remainingAmount <= 0 ? "Paid" : tx.status };
      allocations.push({ transactionId: tx.id, amount: roundMoney(applied) });
      amountLeft = roundMoney(amountLeft - applied);
    }
    persist.commissionTransactions(commissionTransactions.map((t) => updates[t.id] || t));
    const payment = {
      id: uid("cpay"), agentId: agent.id, agentName: agent.name,
      date: data.date, amount: data.amount, method: data.method,
      referenceNumber: data.referenceNumber, notes: data.notes,
      allocations, createdBy: currentUser?.name || currentUser?.username, createdAt: new Date().toISOString(),
    };
    persist.commissionPayments([...commissionPayments, payment]);
    logAudit("Commission Paid", agent.name, fmtMoney(data.amount));
  }

  /* ---------- Branch-scoped visibility ---------- */
  // Products, drivers, and the entire Commission module stay global/
  // unscoped (same as the pre-existing pattern for products/drivers) —
  // only customers/invoices/payments are filtered per-branch for staff
  // who are assigned to a specific branch.
  const isBranchScoped = currentUser && currentUser.role !== "admin" && !!currentUser.branchId;
  const visibleCustomers = isBranchScoped ? customers.filter((c) => c.branchId === currentUser.branchId) : customers;
  const visibleCustomerIds = new Set(visibleCustomers.map((c) => c.id));
  const visibleInvoices = isBranchScoped
    ? invoices.filter((i) => (i.branchId ? i.branchId === currentUser.branchId : visibleCustomerIds.has(i.customerId)))
    : invoices;
  const visiblePayments = isBranchScoped
    ? payments.filter((p) => (p.branchId ? p.branchId === currentUser.branchId : visibleCustomerIds.has(p.customerId)))
    : payments;

  function handleLogin(user) { setCurrentUser(user); }
  function handleLogout() { setCurrentUser(null); setPage("dashboard"); }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-100 text-slate-400 font-bold uppercase tracking-wide">Loading...</div>;
  }

  if (!currentUser) {
    return (
      <>
        <I18nDomBridge />
        <Login users={users} customers={customers} onLogin={handleLogin} companyName={settings.companyName} logoUrl={settings.logoUrl} onResetUsers={onResetUsers} />
      </>
    );
  }

  if (currentUser.role === "customer") {
    return (
      <>
        <I18nDomBridge />
        <CustomerPortal
          currentUser={currentUser} customers={customers} invoices={invoices} payments={payments}
          returns={returns} exchanges={exchanges} promises={promises} transfers={transfers} adjustments={adjustments}
          offers={offers} settings={settings}
        />
      </>
    );
  }

  const nextDriverCode = "DRV-" + String(settings.driverCounter).padStart(4, "0");

  const pages = {
    dashboard: (
      <Dashboard
        customers={visibleCustomers} invoices={visibleInvoices} payments={visiblePayments}
        returns={returns} exchanges={exchanges} promises={promises} transfers={transfers} adjustments={adjustments}
        leads={leads} bookings={bookings} onOpenPromises={() => setPage("promises")}
      />
    ),
    customers: (
      <Customers
        customers={visibleCustomers} invoices={visibleInvoices} payments={visiblePayments}
        returns={returns} exchanges={exchanges} promises={promises} transfers={transfers} adjustments={adjustments}
        saveCustomer={saveCustomer} deleteCustomer={deleteCustomer} openLedger={openLedger}
        branches={branches} currentUser={currentUser}
      />
    ),
    invoices: (
      <Invoices
        customers={visibleCustomers} products={products} drivers={drivers}
        invoices={visibleInvoices} payments={visiblePayments} returns={returns} exchanges={exchanges}
        promises={promises} transfers={transfers} adjustments={adjustments}
        commissionAgents={commissionAgents} commissionRules={commissionRules} commissionTransactions={commissionTransactions}
        bookings={bookings} settings={settings} currentUser={currentUser}
        saveInvoice={saveInvoice} updateInvoice={updateInvoice} cancelInvoice={cancelInvoiceFn}
        prefill={prefill} onClearPrefill={() => setPrefill(null)}
        onBookingFulfilled={onBookingFulfilled} onOrderFulfilled={onOrderFulfilled}
        focusInvoiceId={focusInvoiceId} setFocusInvoiceId={setFocusInvoiceId}
        onGoToReturn={() => setPage("returns")} onGoToExchange={() => setPage("exchange")}
      />
    ),
    invoiceHistory: <InvoiceHistoryPage invoices={visibleInvoices} auditLog={auditLog} />,
    returns: (
      <SalesReturnPage
        customers={visibleCustomers} invoices={visibleInvoices} returns={returns} exchanges={exchanges}
        onCreateReturn={onCreateReturn} onDeleteReturn={onDeleteReturn} currentUser={currentUser}
      />
    ),
    exchange: (
      <ExchangePage
        customers={visibleCustomers} products={products} invoices={visibleInvoices} returns={returns} exchanges={exchanges}
        onCreateExchange={onCreateExchange} onDeleteExchange={onDeleteExchange} currentUser={currentUser}
      />
    ),
    creditNotes: <CreditNotesPage creditNotes={creditNotes} onLinkInvoice={onLinkCreditNoteInvoice} />,
    ledger: (
      <LedgerView
        customers={visibleCustomers} invoices={visibleInvoices} payments={visiblePayments} returns={returns} exchanges={exchanges}
        promises={promises} transfers={transfers} adjustments={adjustments}
        focusId={focusCustomerId || visibleCustomers[0]?.id} setFocusId={setFocusCustomerId}
        settings={settings} currentUser={currentUser}
        onCreateAdjustment={onCreateAdjustment} onUpdateAdjustment={onUpdateAdjustment} onReverseAdjustment={onReverseAdjustment}
      />
    ),
    payments: <Payments customers={visibleCustomers} payments={visiblePayments} promises={promises} savePayment={savePayment} />,
    outstandingTransfer: (
      <OutstandingTransferPage
        customers={visibleCustomers} invoices={visibleInvoices} payments={visiblePayments} returns={returns} exchanges={exchanges}
        promises={promises} transfers={transfers} adjustments={adjustments} currentUser={currentUser}
        onCreateTransfer={onCreateTransfer} onReverseTransfer={onReverseTransfer}
      />
    ),
    adjustments: (
      <AdjustmentsPage
        customers={visibleCustomers} invoices={visibleInvoices} payments={visiblePayments} returns={returns} exchanges={exchanges}
        promises={promises} transfers={transfers} adjustments={adjustments} currentUser={currentUser}
        onCreateAdjustment={onCreateAdjustment} onUpdateAdjustment={onUpdateAdjustment} onReverseAdjustment={onReverseAdjustment}
      />
    ),
    commission: (
      <CommissionPage
        agents={commissionAgents} rules={commissionRules} transactions={commissionTransactions} payments={commissionPayments}
        products={products} invoices={invoices} currentUser={currentUser}
        onCreateAgent={createCommissionAgent} onUpdateAgent={updateCommissionAgent} onToggleAgentStatus={toggleCommissionAgentStatus}
        onCreateRule={createCommissionRule} onUpdateRule={updateCommissionRule}
        onApproveTransaction={approveCommissionTransaction} onCancelTransaction={cancelCommissionTransaction}
        onPayAgent={payCommissionAgent} onPayTransaction={payCommissionTransaction}
      />
    ),
    bookings: (
      <Bookings customers={visibleCustomers} products={products} bookings={bookings} saveBooking={saveBooking}
        onCreateAdvanceBooking={onCreateAdvanceBooking} onConvertToInvoice={convertBookingToInvoice} />
    ),
    orders: (
      <Orders customers={visibleCustomers} products={products} orders={orders} onCreateOrder={onCreateOrder}
        saveOrder={saveOrder} onConvertToInvoice={convertOrderToInvoice} />
    ),
    promises: (
      <PromiseToPayPage
        customers={visibleCustomers} invoices={visibleInvoices} payments={visiblePayments} returns={returns} exchanges={exchanges}
        promises={promises} transfers={transfers} adjustments={adjustments} currentUser={currentUser}
        onCreatePromise={onCreatePromise} onUpdatePromise={onUpdatePromise} onCancelPromise={onCancelPromise}
        focusPromiseId={focusPromiseId} setFocusPromiseId={setFocusPromiseId}
      />
    ),
    leads: <Leads leads={leads} saveLead={saveLead} deleteLead={deleteLead} />,
    products: <Products products={products} saveProduct={saveProduct} deleteProduct={deleteProduct} />,
    drivers: <Drivers drivers={drivers} saveDriver={saveDriver} deleteDriver={deleteDriver} nextCode={nextDriverCode} />,
    offers: <Offers offers={offers} saveOffer={saveOffer} deleteOffer={deleteOffer} />,
    reports: (
      <Reports
        customers={visibleCustomers} invoices={visibleInvoices} payments={visiblePayments} returns={returns} exchanges={exchanges}
        promises={promises} transfers={transfers} adjustments={adjustments} orders={orders}
        commissionAgents={commissionAgents} commissionRules={commissionRules} commissionTransactions={commissionTransactions}
        products={products}
      />
    ),
    assistant: <SalesAssistant customers={visibleCustomers} />,
    estimator: <CementEstimator settings={settings} />,
    settings: (
      <Settings
        settings={settings} saveSettings={saveSettings}
        users={users} saveUser={saveUser} deleteUser={deleteUser}
        branches={branches} saveBranch={saveBranch} deleteBranch={deleteBranch}
        onRestoreBackup={onRestoreBackup} exportBackup={exportBackup}
      />
    ),
  };

  return (
    <>
      <I18nDomBridge />
      <div className="flex h-screen bg-slate-100 text-slate-900">
        <Sidebar page={page} setPage={setPage} role={currentUser.role} onLogout={handleLogout} companyName={settings.companyName} logoUrl={settings.logoUrl} />
        <div className="flex-1 overflow-y-auto">
          <div className="flex items-center justify-end gap-3 px-6 py-2 border-b border-slate-200 bg-white print:hidden">
            <span className="text-xs text-slate-500">{t("Welcome,")} <span className="font-bold text-slate-700">{currentUser.name || currentUser.username}</span></span>
            <LanguageSwitcher compact />
          </div>
          <div className="p-6">
            {pages[page] || pages.dashboard}
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
