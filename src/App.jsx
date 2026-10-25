import React, { useState, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
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
    "Edit Payment": "ادائیگی میں ترمیم",
    "Receiving": "وصولی",
    "Payment Receipt": "ادائیگی کی رسید",
    "Receipt No.": "رسید نمبر",
    "Customer Details": "گاہک کی تفصیلات",
    "Payment Details": "ادائیگی کی تفصیلات",
    "Balance Summary": "بیلنس کا خلاصہ",
    "Remaining Balance": "باقی بیلنس",
    "Save as PDF": "پی ڈی ایف کے طور پر محفوظ کریں",
    "Actions": "کارروائیاں",
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
  const opt = (code, label) => (
    <button
      type="button"
      onClick={() => setLanguage(code)}
      className={`${compact ? "px-2.5 py-1 text-[11.5px]" : "px-3 py-1.5 text-xs"} rounded-lg font-bold transition-all duration-200
        ${language === code ? "bg-white text-slate-900 shadow-sm" : "ct-t2 hover:opacity-80"}`}
    >
      {label}
    </button>
  );
  return (
    <div className="inline-flex items-center gap-0.5 p-1 rounded-xl ct-chip" dir="ltr">
      {opt("en", "EN")}
      {opt("ur", "اردو")}
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
    if (typeof document === "undefined") return undefined;
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
    const ATTRS = ["placeholder", "title", "aria-label"];
    const ATTR_SELECTOR = "input[placeholder], textarea[placeholder], [title], [aria-label]";
    const shouldSkip = (node) => {
      const el = node.parentElement;
      if (!el) return true;
      if (el.closest && el.closest(".ct-paper")) return true;
      const tag = el.tagName;
      return ["SCRIPT", "STYLE", "TEXTAREA"].includes(tag) ||
        (tag === "INPUT" && !["button", "submit"].includes((el.type || "").toLowerCase()));
    };
    const translateText = (textNode) => {
      if (shouldSkip(textNode)) return;
      const raw = textNode.nodeValue || "";
      const trimmed = raw.trim();
      if (!trimmed || trimmed.length > 180) return;
      const translated = translateValue(trimmed);
      if (translated !== trimmed) textNode.nodeValue = raw.replace(trimmed, translated);
    };
    const translateAttrs = (el) => {
      if (!el || !el.matches || !el.matches(ATTR_SELECTOR)) return;
      ATTRS.forEach((attr) => {
        if (!el.hasAttribute(attr)) return;
        const value = el.getAttribute(attr);
        if (value && value.length < 180) {
          const translated = translateValue(value);
          if (translated !== value) el.setAttribute(attr, translated);
        }
      });
    };
    const translateTree = (node) => {
      if (!node) return;
      if (node.nodeType === 3) { translateText(node); return; }
      if (node.nodeType !== 1) return;
      const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
      const nodes = [];
      let n;
      while ((n = walker.nextNode())) nodes.push(n);
      nodes.forEach(translateText);
      translateAttrs(node);
      node.querySelectorAll(ATTR_SELECTOR).forEach(translateAttrs);
    };

    // One full pass whenever the language changes (this is also what turns
    // Urdu text back into English).
    const fullPass = requestAnimationFrame(() => translateTree(root));

    // PERFORMANCE: every literal UI string is written in English, so in
    // English mode nothing new ever needs translating — no observer at all.
    // (Before, the whole page was re-scanned after every DOM change.)
    if (language !== "ur") return () => cancelAnimationFrame(fullPass);

    // Urdu: translate only what actually changed — new nodes, text React
    // updated in place, and changed placeholder/title/aria-label attributes.
    // Batched into at most one pass per animation frame.
    const pendingTrees = new Set();
    const pendingAttrs = new Set();
    let frame = 0;
    const flush = () => {
      frame = 0;
      const trees = Array.from(pendingTrees);
      const attrs = Array.from(pendingAttrs);
      pendingTrees.clear();
      pendingAttrs.clear();
      trees.forEach((node) => { if (node.isConnected) translateTree(node); });
      attrs.forEach((el) => { if (el.isConnected) translateAttrs(el); });
    };
    const observer = new MutationObserver((records) => {
      records.forEach((r) => {
        if (r.type === "childList") r.addedNodes.forEach((node) => pendingTrees.add(node));
        else if (r.type === "characterData") pendingTrees.add(r.target);
        else if (r.type === "attributes") pendingAttrs.add(r.target);
      });
      if (!frame && (pendingTrees.size || pendingAttrs.size)) frame = requestAnimationFrame(flush);
    });
    observer.observe(root, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
    return () => {
      cancelAnimationFrame(fullPass);
      if (frame) cancelAnimationFrame(frame);
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
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
// Date-only helpers. Invoice/payment/booking dates are stored as plain
// "YYYY-MM-DD" strings — calendar dates, not timestamps — so they must
// never be routed through UTC (toISOString / new Date("YYYY-MM-DD")),
// which can shift them by one day depending on the device timezone.
function dateToLocalISO(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function parseDateValue(v) {
  const m = typeof v === "string" ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(v) : null;
  // Date-only string -> same calendar day in local time (no UTC shift).
  // Anything else (full timestamps such as uploaded_at) is parsed as before.
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(v);
}
function addOneMonth(dateStr) {
  const d = parseDateValue(dateStr || todayISO());
  d.setMonth(d.getMonth() + 1);
  return dateToLocalISO(d);
}
function fmtMoney(n) {
  const v = Number(n) || 0;
  return "Rs " + v.toLocaleString("en-PK", { maximumFractionDigits: 0 });
}
function fmtDate(d) {
  if (!d) return "-";
  const dt = parseDateValue(d);
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

/* ============================================================
   STARTUP DATA LOADING
   ------------------------------------------------------------
   Same keys and same defaults as before, but:
   - Supabase: ONE request for all startup keys instead of 24
     separate round trips (big win on slow connections).
   - A slow / failed Supabase request now shows an error with a
     Retry button. Before, each failed key silently fell back to
     this browser's localStorage copy — mixing old local data with
     live data, which the next save would then write back to the
     shared database. Nothing is written during startup.
   - Hard timeout, so the loading screen can never spin forever.
   - No Supabase configured: reads localStorage exactly as before.
   ============================================================ */
const STARTUP_TIMEOUT_MS = 25000;
const STARTUP_DATA = [
  ["users", "ct-users", () => DEFAULT_USERS],
  ["customers", "ct-customers", () => []],
  ["invoices", "ct-invoices", () => []],
  ["payments", "ct-payments", () => []],
  ["returns", "ct-returns", () => []],
  ["exchanges", "ct-exchanges", () => []],
  ["creditNotes", "ct-creditnotes", () => []],
  ["promises", "ct-promises", () => []],
  ["transfers", "ct-transfers", () => []],
  ["adjustments", "ct-adjustments", () => []],
  ["leads", "ct-leads", () => []],
  ["products", "ct-products", () => []],
  ["drivers", "ct-drivers", () => []],
  ["offers", "ct-offers", () => []],
  ["bookings", "ct-bookings", () => []],
  ["orders", "ct-orders", () => []],
  ["settings", "ct-settings", () => DEFAULT_SETTINGS],
  ["branches", "ct-branches", () => DEFAULT_BRANCHES],
  ["auditLog", "ct-auditlog", () => []],
  ["commissionAgents", "ct-commissionagents", () => []],
  ["commissionRules", "ct-commissionrules", () => []],
  ["commissionTransactions", "ct-commissiontransactions", () => []],
  ["commissionPayments", "ct-commissionpayments", () => []],
  ["orderTargets", "ct-ordertargets", () => []],
];
const STARTUP_MSG_FAILED = "Could not load your data from the database. Check your internet connection, then press Retry.";
const STARTUP_MSG_TIMEOUT = "The database is taking too long to respond. Check your internet connection, then press Retry.";

function startupError(message, cause) {
  const e = new Error(message);
  e.userMessage = message;
  if (cause) e.cause = cause;
  return e;
}

function startupWithTimeout(thenable, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(startupError(STARTUP_MSG_TIMEOUT)), ms);
  });
  return Promise.race([Promise.resolve(thenable), timeout]).finally(() => clearTimeout(timer));
}

async function loadStartupData(onStage) {
  const data = {};
  if (supabase) {
    if (onStage) onStage("remote");
    const keys = STARTUP_DATA.map((d) => d[1]);
    let res;
    try {
      res = await startupWithTimeout(supabase.from("kv_store").select("key,value").in("key", keys), STARTUP_TIMEOUT_MS);
    } catch (e) {
      if (e && e.userMessage) throw e;
      throw startupError(STARTUP_MSG_FAILED, e);
    }
    if (!res || res.error) throw startupError(STARTUP_MSG_FAILED, res && res.error);
    const byKey = new Map();
    (res.data || []).forEach((row) => { if (row && !byKey.has(row.key)) byKey.set(row.key, row.value); });
    STARTUP_DATA.forEach(([name, key, fallback]) => {
      const value = byKey.get(key);
      data[name] = value != null ? value : fallback();
    });
    return data;
  }
  if (onStage) onStage("local");
  STARTUP_DATA.forEach(([name, key, fallback]) => {
    let value = null;
    try {
      const raw = window.localStorage.getItem(LS_PREFIX + key);
      value = raw !== null ? JSON.parse(raw) : null;
    } catch {
      value = null;
    }
    data[name] = value != null ? value : fallback();
  });
  return data;
}

const STARTUP_URDU = {
  "Loading your workspace…": "آپ کا ورک اسپیس لوڈ ہو رہا ہے…",
  "Fetching your data from the database…": "ڈیٹا بیس سے آپ کا ڈیٹا حاصل کیا جا رہا ہے…",
  "Opening the data saved on this device…": "اس ڈیوائس پر محفوظ ڈیٹا کھولا جا رہا ہے…",
  "Retry": "دوبارہ کوشش کریں",
  "Nothing was changed — your saved data is safe.": "کچھ بھی تبدیل نہیں ہوا — آپ کا محفوظ ڈیٹا بالکل محفوظ ہے۔",
  [STARTUP_MSG_FAILED]: "ڈیٹا بیس سے آپ کا ڈیٹا لوڈ نہیں ہو سکا۔ انٹرنیٹ کنکشن چیک کریں، پھر دوبارہ کوشش کریں دبائیں۔",
  [STARTUP_MSG_TIMEOUT]: "ڈیٹا بیس جواب دینے میں بہت دیر لگا رہا ہے۔ انٹرنیٹ کنکشن چیک کریں، پھر دوبارہ کوشش کریں دبائیں۔",
};
Object.entries(STARTUP_URDU).forEach(([en, ur]) => {
  if (!(en in translations.ur)) translations.ur[en] = ur;
});

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

/* ============================================================
   PREMIUM UI SHELL  (design layer only)
   ------------------------------------------------------------
   Everything in this block is presentation: theme (dark / light),
   icons, sidebar, header pieces, modal, buttons, inputs and
   animations. No stored data, calculation or business rule is read
   or changed here. All existing pages keep their markup — the
   ThemeStyles sheet restyles them for the dark theme on SCREEN only,
   so every print / PDF stays exactly as it was (white paper).
   ============================================================ */

const UI_URDU = {
  "Overview": "جائزہ",
  "Sales": "فروخت",
  "Finance": "مالیات",
  "Business": "کاروبار",
  "Tools": "ٹولز",
  "Premium ERP": "پریمیم ای آر پی",
  "Good morning": "صبح بخیر",
  "Good afternoon": "سہ پہر بخیر",
  "Good evening": "شام بخیر",
  "Search pages, customers, invoices…": "صفحات، گاہک، انوائس تلاش کریں…",
  "Notifications": "اطلاعات",
  "No new notifications": "کوئی نئی اطلاع نہیں",
  "Light mode": "لائٹ موڈ",
  "Dark mode": "ڈارک موڈ",
  "More": "مزید",
  "Home": "ہوم",
  "Pages": "صفحات",
  "All Branches": "تمام برانچز",
  "Owner": "مالک",
  "Sign in to your account": "اپنے اکاؤنٹ میں لاگ اِن کریں",
  "Construction materials · Billing · Ledger": "تعمیراتی سامان · بلنگ · لیجر",
  "Invoices, ledger, payments and bookings — in one place.": "انوائسز، لیجر، ادائیگیاں اور بکنگز — ایک ہی جگہ۔",
  "No results": "کوئی نتیجہ نہیں",
  "Live data sync": "لائیو ڈیٹا سنک",
  "Saved on this device": "اسی ڈیوائس پر محفوظ",
};
Object.entries(UI_URDU).forEach(([en, ur]) => {
  if (!(en in translations.ur)) translations.ur[en] = ur;
});

/* ---------------- Theme (dark / light) ---------------- */

const THEME_STORAGE_KEY = "ct-theme";
let themeState = (() => {
  try { return window.localStorage.getItem(THEME_STORAGE_KEY) === "light" ? "light" : "dark"; } catch { return "dark"; }
})();
const themeListeners = new Set();

function applyThemeClass(theme) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("ct-dark", theme === "dark");
  document.documentElement.classList.toggle("ct-light", theme !== "dark");
}
applyThemeClass(themeState);

function setTheme(next) {
  themeState = next === "light" ? "light" : "dark";
  try { window.localStorage.setItem(THEME_STORAGE_KEY, themeState); } catch {}
  applyThemeClass(themeState);
  themeListeners.forEach((l) => l(themeState));
}

function useTheme() {
  const [theme, setLocal] = useState(themeState);
  useEffect(() => {
    themeListeners.add(setLocal);
    return () => { themeListeners.delete(setLocal); };
  }, []);
  return theme;
}

/* ---------------- Icons ---------------- */

const UI_ICON_PATHS = {
  voucher: "M5 2h14v20l-2.5-1.5L14 22l-2-1.5-2 1.5-2.5-1.5L5 22zM9 7h6M9 11h6M9 15h3",
  dashboard: "M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z",
  users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  file: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8",
  history: "M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l4 2",
  undo: "M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11",
  swap: "M17 3l4 4-4 4M3 7h18M7 21l-4-4 4-4M21 17H3",
  note: "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z",
  book: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15zM20 17v5H6.5A2.5 2.5 0 0 1 4 19.5",
  wallet: "M20 7H5a2 2 0 0 1 0-4h13v4M3 5v14a2 2 0 0 0 2 2h15V7M16 14h.01",
  transfer: "M7 7h10M7 7l3-3M7 7l3 3M17 17H7M17 17l-3-3M17 17l-3 3",
  sliders: "M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6",
  calendar: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
  phone: "M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z",
  clock: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2",
  zap: "M13 2 3 14h9l-1 8 10-12h-9z",
  box: "M21 8 12 3 3 8v8l9 5 9-5zM3 8l9 5 9-5M12 13v8",
  truck: "M1 3h15v13H1zM16 8h4l3 3v5h-7zM5.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM18.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  gift: "M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z",
  chart: "M3 3v18h18M7 16v-5M12 16V7M17 16v-3",
  chat: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  calc: "M6 2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM8 6h8M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01",
  percent: "M19 5 5 19M6.5 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM17.5 20a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  menu: "M3 6h18M3 12h18M3 18h18",
  x: "M18 6 6 18M6 6l12 12",
  lock: "M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4",
  plus: "M12 5v14M5 12h14",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3",
  bell: "M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0",
  sun: "M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41",
  moon: "M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z",
  spark: "M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9z",
  cash: "M2 6h20v12H2zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 12h.01M18 12h.01",
  trend: "M22 7 13.5 15.5 8.5 10.5 2 17M16 7h6v6",
  down: "M22 17 13.5 8.5 8.5 13.5 2 7M16 17h6v-6",
  chev: "M6 9l6 6 6-6",
  right: "M9 18l6-6-6-6",
  branch: "M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6",
  home: "M3 10l9-7 9 7v10a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2z",
  more: "M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM19 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM5 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z",
  alert: "M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  printer: "M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z",
  download: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3",
  wa: "M3 21l1.7-5A8.5 8.5 0 1 1 8 19.3zM9 9.5c.5 2.5 2.5 4.5 5 5l1.2-1.2 2 1-.5 1.7c-3.6.4-8.2-4.2-7.8-7.8L10.6 7l1 2z",
  check: "M20 6 9 17l-5-5",
  image: "M3 3h18v18H3zM8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM21 15l-5-5L5 21",
};

function UiIcon({ name, className = "w-[18px] h-[18px]" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 ${className}`} aria-hidden="true">
      <path d={UI_ICON_PATHS[name] || UI_ICON_PATHS.dashboard} />
    </svg>
  );
}

/* ---------------- Navigation structure (same page ids as before) ---------------- */

const NAV_GROUPS = [
  { title: "Overview", items: [
    { id: "dashboard", label: "Dashboard", icon: "dashboard" },
  ]},
  { title: "Sales", items: [
    { id: "invoices", label: "Invoices", icon: "file" },
    { id: "invoiceHistory", label: "Invoice History", icon: "history" },
    { id: "orders", label: "Daily Orders", icon: "phone" },
    { id: "bookings", label: "Advance Booking", icon: "calendar" },
    { id: "returns", label: "Sales Return", icon: "undo" },
    { id: "exchange", label: "Exchange", icon: "swap" },
    { id: "creditNotes", label: "Credit Notes", icon: "note" },
  ]},
  { title: "Finance", items: [
    { id: "customers", label: "Customers", icon: "users" },
    { id: "ledger", label: "Ledger", icon: "book" },
    { id: "payments", label: "Payments", icon: "wallet" },
    { id: "promises", label: "Promise To Pay", icon: "clock" },
    { id: "outstandingTransfer", label: "Outstanding Transfer", icon: "transfer" },
    { id: "adjustments", label: "Adjustments", icon: "sliders" },
    { id: "vouchers", label: "Payment Vouchers", icon: "voucher" },
    { id: "cashbook", label: "Cash Book", icon: "cash" },
  ]},
  { title: "Business", items: [
    { id: "commission", label: "Commission", icon: "percent" },
    { id: "leads", label: "Leads", icon: "zap" },
    { id: "products", label: "Products", icon: "box" },
    { id: "drivers", label: "Drivers", icon: "truck" },
    { id: "offers", label: "Offers", icon: "gift" },
  ]},
  { title: "Tools", items: [
    { id: "reports", label: "Reports", icon: "chart" },
    { id: "insights", label: "Business Insights", icon: "trend" },
    { id: "assistant", label: "Sales Assistant", icon: "chat" },
    { id: "estimator", label: "Cement Estimator", icon: "calc" },
    { id: "settings", label: "Settings", icon: "settings", adminOnly: true },
  ]},
];

function navItemFor(pageId) {
  for (const g of NAV_GROUPS) {
    const it = g.items.find((x) => x.id === pageId);
    if (it) return { ...it, group: g.title };
  }
  return { id: "dashboard", label: "Dashboard", icon: "dashboard", group: "Overview" };
}

function uiInitials(name, fallback = "CT") {
  const s = String(name || "").trim();
  if (!s) return fallback;
  return s.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

const UI_AVATAR_GRADIENTS = [
  "from-sky-400 to-indigo-500", "from-rose-400 to-pink-600", "from-emerald-400 to-teal-600",
  "from-violet-400 to-purple-600", "from-amber-300 to-orange-500", "from-cyan-400 to-blue-600",
];
function uiAvatarGradient(key) {
  const s = String(key || "");
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return UI_AVATAR_GRADIENTS[h % UI_AVATAR_GRADIENTS.length];
}

/* ---------------- Animated number (count-up) ----------------
   Animates only the number on screen; the real value is shown as soon
   as the animation ends (and immediately when motion is reduced). */

function uiReducedMotion() {
  try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { return false; }
}

function CountUp({ value, format = (n) => String(Math.round(n)), duration = 900 }) {
  const target = Number(value) || 0;
  const [shown, setShown] = useState(uiReducedMotion() ? target : 0);
  const fromRef = React.useRef(0);
  useEffect(() => {
    if (uiReducedMotion()) { setShown(target); return undefined; }
    const from = fromRef.current;
    let raf;
    const start = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(from + (target - from) * eased);
      if (p < 1) raf = requestAnimationFrame(step);
      else fromRef.current = target;
    };
    raf = requestAnimationFrame(step);
    return () => { cancelAnimationFrame(raf); fromRef.current = target; };
  }, [target]);
  return <>{format(shown)}</>;
}

/* ---------------- Global theme stylesheet ---------------- */

const UI_THEME_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Naskh+Arabic:wght@400;500;600;700&display=swap');

/* ---------- Animations ---------- */
@keyframes ctFadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
@keyframes ctFade { from { opacity: 0; } to { opacity: 1; } }
@keyframes ctPop { from { opacity: 0; transform: translateY(10px) scale(.98); } to { opacity: 1; transform: none; } }
@keyframes ctGrowY { from { transform: scaleY(0); } to { transform: scaleY(1); } }
@keyframes ctGrowX { from { transform: scaleX(0); } to { transform: scaleX(1); } }
@keyframes ctDraw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
@keyframes ctPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(52,211,153,.55); } 70% { box-shadow: 0 0 0 8px rgba(52,211,153,0); } }
@keyframes ctShimmer { from { background-position: -200% 0; } to { background-position: 200% 0; } }
.ct-page { animation: ctFadeUp .45s cubic-bezier(.2,.7,.2,1) backwards; }
.ct-rise { animation: ctFadeUp .55s cubic-bezier(.2,.7,.2,1) backwards; }
.ct-modal-panel { animation: ctPop .28s cubic-bezier(.2,.7,.2,1) backwards; }
.ct-modal-back { animation: ctFade .2s ease backwards; }
.ct-bar { transform-origin: bottom; transform-box: fill-box; animation: ctGrowY .8s cubic-bezier(.2,.7,.2,1) backwards; }
.ct-barx { transform-origin: left; animation: ctGrowX .9s cubic-bezier(.2,.7,.2,1) backwards; }
[dir="rtl"] .ct-barx { transform-origin: right; }
.ct-draw { stroke-dasharray: 1; stroke-dashoffset: 1; animation: ctDraw 1.4s .2s cubic-bezier(.4,0,.2,1) forwards; }
.ct-live { animation: ctPulse 2s infinite; }
.ct-lift { transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease; }
.ct-lift:hover { transform: translateY(-2px); }
@media (prefers-reduced-motion: reduce) {
  .ct-page, .ct-rise, .ct-modal-panel, .ct-modal-back, .ct-bar, .ct-barx, .ct-live { animation: none !important; }
  .ct-draw { animation: none !important; stroke-dashoffset: 0; }
  .ct-lift:hover { transform: none; }
}

/* ---------- Shared surfaces ---------- */
.ct-mesh { background: radial-gradient(800px 420px at 8% -8%, rgba(16,185,129,.15), transparent 60%),
  radial-gradient(760px 480px at 92% -12%, rgba(99,102,241,.16), transparent 60%),
  radial-gradient(900px 600px at 50% 120%, rgba(212,175,95,.06), transparent 60%), #060a13; }
html.ct-light .ct-mesh { background: radial-gradient(800px 420px at 8% -8%, rgba(16,185,129,.10), transparent 60%),
  radial-gradient(760px 480px at 92% -12%, rgba(99,102,241,.08), transparent 60%), #f4f6fa; }
.ct-card { background: linear-gradient(180deg, rgba(148,163,184,.075), rgba(148,163,184,.03)); border: 1px solid rgba(148,163,184,.13);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.05), 0 24px 48px -28px rgba(0,0,0,.9); border-radius: 20px; }
html.ct-light .ct-card { background: #fff; border-color: #e6e9ef; box-shadow: 0 1px 2px rgba(16,24,40,.04), 0 12px 32px -20px rgba(16,24,40,.18); }
.ct-chip { background: rgba(148,163,184,.08); border: 1px solid rgba(148,163,184,.13); }
html.ct-light .ct-chip { background: #f3f5f9; border-color: #e3e7ee; }
.ct-gold-bg { background: linear-gradient(135deg, #f3dca0, #d4a94f); color: #2a1f05; }
.ct-em-btn { background: linear-gradient(135deg, #34d399, #10b981 55%, #059669); color: #022c22;
  box-shadow: 0 10px 30px -12px rgba(16,185,129,.8), inset 0 1px 0 rgba(255,255,255,.35); }
.ct-h { color: #f8fafc; } html.ct-light .ct-h { color: #0f172a; }
.ct-t2 { color: #94a3b8; } html.ct-light .ct-t2 { color: #64748b; }
.ct-t3 { color: #64748b; } html.ct-light .ct-t3 { color: #94a3b8; }
.ct-line { border-color: rgba(148,163,184,.12) !important; } html.ct-light .ct-line { border-color: #e6e9ef !important; }
.ct-display { font-family: "Inter Display", Inter, system-ui, sans-serif; letter-spacing: -.03em; }
.ct-nav::-webkit-scrollbar { width: 6px; } .ct-nav::-webkit-scrollbar-thumb { background: rgba(255,255,255,.12); border-radius: 999px; }
.ct-scroll::-webkit-scrollbar { width: 10px; height: 10px; }
.ct-scroll::-webkit-scrollbar-thumb { background: rgba(148,163,184,.35); border-radius: 999px; border: 3px solid transparent; background-clip: content-box; }

@media screen {
  /* ---------- Existing pages: shared polish (both themes) ---------- */
  .ct-content h2.text-xl { text-transform: none; font-size: 1.55rem; line-height: 2rem; font-weight: 800; letter-spacing: -.025em; }
  .ct-content h3.text-lg { text-transform: none; letter-spacing: -.01em; }
  .ct-content .bg-white.border:not(.print-area):not(.ct-paper):not(:is(.print-area, .ct-paper) *) { border-radius: 16px; }
  .ct-content .bg-white.border > div:first-child.border-b:not(:is(.print-area, .ct-paper) *) { text-transform: none; letter-spacing: 0; font-size: 13.5px; }
  .ct-content table:not(:is(.print-area, .ct-paper) *) { border-collapse: separate; border-spacing: 0; }
  .ct-content thead tr:not(.bg-slate-900) th { font-size: 11px; font-weight: 600; letter-spacing: .05em; padding-top: 11px; padding-bottom: 11px; white-space: nowrap; }
  .ct-content tbody tr:not(:is(.print-area, .ct-paper) *) { transition: background-color .12s ease; }
  .ct-content span.text-\\[10px\\].uppercase:not(:is(.print-area, .ct-paper) *) { border-radius: 999px; padding: 3px 10px; letter-spacing: .03em; font-weight: 700; display: inline-block; line-height: 1.25; }
  .ct-content :is(.bg-slate-50,.bg-blue-50,.bg-amber-50,.bg-red-50,.bg-emerald-50,.bg-purple-50).border:not(:is(.print-area, .ct-paper) *) { border-radius: 12px; }
  .ct-content select.text-xs.border:not(:is(.print-area, .ct-paper) *), .ct-content input.text-xs.border:not(:is(.print-area, .ct-paper) *) { border-radius: 8px; padding: 4px 8px; }
  .ct-content td > button.text-xs.font-bold { border-radius: 6px; padding: 3px 7px; margin: -3px 0; transition: background-color .15s; }
  /* Item rows (invoice / exchange): fixed-width inputs keep their width, the name field gets the rest. */
  .ct-content :is(input, select).w-16 { width: 4rem; } .ct-content :is(input, select).w-20 { width: 5rem; }
  .ct-content :is(input, select).w-24 { width: 6rem; } .ct-content :is(input, select).w-28 { width: 7rem; }
  .ct-content :is(input, select).w-36 { width: 9rem; } .ct-content :is(input, select).w-40 { width: 10rem; }
  .ct-content :is(input, select).flex-1 { min-width: 7rem; }
  [dir="rtl"] .ct-content .text-left { text-align: right; }
  [dir="rtl"] .ct-content .text-right { text-align: left; }

  html.ct-light .ct-content .bg-white.border:not(.print-area):not(.ct-paper):not(:is(.print-area, .ct-paper) *) { border-color: #e6e9ef; box-shadow: 0 1px 2px rgba(16,24,40,.04), 0 10px 28px -22px rgba(16,24,40,.25); }
  html.ct-light .ct-content thead tr:not(.bg-slate-900) { background: #f8fafc; }
  html.ct-light .ct-content tbody tr:not(:is(.print-area, .ct-paper) *):hover { background-color: #f8fafc; }
  html.ct-light .ct-content td > button.text-xs.font-bold:hover { background: #ecfdf5; }
  html.ct-light :is(.text-rose-300,.text-rose-400) { color: #e11d48; }
  html.ct-light :is(.text-emerald-300,.text-emerald-400) { color: #059669; }
  html.ct-light .text-\\[\\#e9c77b\\] { color: #a16207; }
  html.ct-light .text-sky-400 { color: #0284c7; }
  html.ct-light .text-amber-400 { color: #d97706; }
  html.ct-light .text-\\[\\#d4a94f\\] { color: #a16207; }

  /* ---------- Dark theme: remap the light utility colours ---------- */
  html.ct-dark .ct-content { color: #cbd5e1; color-scheme: dark; }
  html.ct-dark .ct-content :is(.bg-white):not(.print-area):not(.ct-paper):not(:is(.print-area, .ct-paper) *) { background-color: #0e1526; }
  html.ct-dark .ct-content .bg-white.border:not(.print-area):not(.ct-paper):not(:is(.print-area, .ct-paper) *) { background: linear-gradient(180deg, rgba(30,41,59,.55), rgba(15,23,42,.55)); border-color: rgba(148,163,184,.14); box-shadow: inset 0 1px 0 rgba(255,255,255,.04), 0 24px 48px -30px rgba(0,0,0,.9); }
  html.ct-dark .ct-content :is(.bg-slate-50,.bg-slate-100):not(.print-area):not(.ct-paper):not(:is(.print-area, .ct-paper) *) { background-color: rgba(148,163,184,.08); }
  html.ct-dark .ct-content .bg-slate-200:not(.print-area):not(.ct-paper):not(:is(.print-area, .ct-paper) *) { background-color: rgba(148,163,184,.16); }
  html.ct-dark .ct-content .bg-slate-300:not(:is(.print-area, .ct-paper) *) { background-color: rgba(148,163,184,.28); }
  html.ct-dark .ct-content .bg-slate-900:not(:is(.print-area, .ct-paper) *):not(.ct-keep) { background-color: #1e293b; }
  html.ct-dark .ct-content button.bg-slate-900:not(.ct-keep):not(:is(.print-area, .ct-paper) *) { background: rgba(16,185,129,.16); border-color: rgba(52,211,153,.7); color: #ecfdf5; }
  html.ct-dark .ct-content :is(.hover\\:bg-slate-50,.hover\\:bg-slate-100):not(:is(.print-area, .ct-paper) *):hover { background-color: rgba(148,163,184,.10); }
  html.ct-dark .ct-content tbody tr:not(:is(.print-area, .ct-paper) *):hover { background-color: rgba(148,163,184,.05); }
  html.ct-dark .ct-content thead tr:not(.bg-slate-900):not(:is(.print-area, .ct-paper) *) { background: rgba(148,163,184,.06); }
  html.ct-dark .ct-content td > button.text-xs.font-bold:hover { background: rgba(52,211,153,.12); }

  html.ct-dark .ct-content .text-slate-900:not(:is(.print-area, .ct-paper) *), html.ct-dark .ct-content .text-slate-800:not(:is(.print-area, .ct-paper) *) { color: #f1f5f9; }
  html.ct-dark .ct-content .text-slate-700:not(:is(.print-area, .ct-paper) *) { color: #e2e8f0; }
  html.ct-dark .ct-content :is(.text-slate-600,.text-slate-500):not(:is(.print-area, .ct-paper) *) { color: #94a3b8; }
  html.ct-dark .ct-content .text-slate-400:not(:is(.print-area, .ct-paper) *) { color: #64748b; }
  html.ct-dark .ct-content .text-slate-300:not(:is(.print-area, .ct-paper) *) { color: #475569; }
  html.ct-dark .ct-content :is(.hover\\:text-slate-900,.hover\\:text-slate-700):not(:is(.print-area, .ct-paper) *):hover { color: #fff; }

  html.ct-dark .ct-content :is(.border-slate-100,.border-slate-200):not(.print-area):not(.ct-paper):not(:is(.print-area, .ct-paper) *) { border-color: rgba(148,163,184,.13); }
  html.ct-dark .ct-content :is(.border-slate-300,.border-slate-400):not(:is(.print-area, .ct-paper) *) { border-color: rgba(148,163,184,.24); }
  html.ct-dark .ct-content .border-slate-900:not(:is(.print-area, .ct-paper) *) { border-color: rgba(226,232,240,.55); }
  html.ct-dark .ct-content .divide-slate-100:not(:is(.print-area, .ct-paper) *) > * + * { border-color: rgba(148,163,184,.12); }

  html.ct-dark .ct-content .text-blue-700:not(:is(.print-area, .ct-paper) *), html.ct-dark .ct-content .hover\\:text-blue-700:not(:is(.print-area, .ct-paper) *):hover { color: #a5b4fc; }
  html.ct-dark .ct-content .text-blue-800:not(:is(.print-area, .ct-paper) *) { color: #c7d2fe; }
  html.ct-dark .ct-content :is(.text-red-600,.text-red-700,.text-red-800):not(:is(.print-area, .ct-paper) *), html.ct-dark .ct-content .hover\\:text-red-600:not(:is(.print-area, .ct-paper) *):hover { color: #fb7185; }
  html.ct-dark .ct-content :is(.text-emerald-600,.text-emerald-700,.text-emerald-800):not(:is(.print-area, .ct-paper) *), html.ct-dark .ct-content .hover\\:text-emerald-600:not(:is(.print-area, .ct-paper) *):hover { color: #34d399; }
  html.ct-dark .ct-content :is(.text-amber-600,.text-amber-700,.text-amber-800):not(:is(.print-area, .ct-paper) *) { color: #fbbf24; }
  html.ct-dark .ct-content :is(.text-purple-700,.text-purple-800):not(:is(.print-area, .ct-paper) *) { color: #c4b5fd; }

  html.ct-dark .ct-content .bg-blue-50:not(:is(.print-area, .ct-paper) *) { background-color: rgba(99,102,241,.10); }
  html.ct-dark .ct-content .bg-amber-50:not(:is(.print-area, .ct-paper) *) { background-color: rgba(245,158,11,.09); }
  html.ct-dark .ct-content :is(.bg-red-50,.hover\\:bg-red-50:hover):not(:is(.print-area, .ct-paper) *) { background-color: rgba(244,63,94,.09); }
  html.ct-dark .ct-content .bg-emerald-50:not(:is(.print-area, .ct-paper) *) { background-color: rgba(16,185,129,.09); }
  html.ct-dark .ct-content .bg-purple-50:not(:is(.print-area, .ct-paper) *) { background-color: rgba(139,92,246,.10); }
  html.ct-dark .ct-content .hover\\:bg-amber-100:not(:is(.print-area, .ct-paper) *):hover { background-color: rgba(245,158,11,.16); }
  html.ct-dark .ct-content .bg-blue-100:not(:is(.print-area, .ct-paper) *) { background-color: rgba(99,102,241,.18); color: #c7d2fe; }
  html.ct-dark .ct-content .bg-red-100:not(:is(.print-area, .ct-paper) *) { background-color: rgba(244,63,94,.16); color: #fda4af; }
  html.ct-dark .ct-content .bg-emerald-100:not(:is(.print-area, .ct-paper) *) { background-color: rgba(16,185,129,.16); color: #6ee7b7; }
  html.ct-dark .ct-content .bg-amber-100:not(:is(.print-area, .ct-paper) *) { background-color: rgba(245,158,11,.16); color: #fcd34d; }
  html.ct-dark .ct-content .bg-purple-100:not(:is(.print-area, .ct-paper) *) { background-color: rgba(139,92,246,.18); color: #ddd6fe; }
  html.ct-dark .ct-content :is(.border-blue-200,.border-blue-700):not(:is(.print-area, .ct-paper) *) { border-color: rgba(129,140,248,.30); }
  html.ct-dark .ct-content :is(.border-amber-200,.border-amber-300):not(:is(.print-area, .ct-paper) *) { border-color: rgba(245,158,11,.30); }
  html.ct-dark .ct-content :is(.border-red-200,.border-red-300):not(:is(.print-area, .ct-paper) *) { border-color: rgba(244,63,94,.30); }
  html.ct-dark .ct-content .border-emerald-200:not(:is(.print-area, .ct-paper) *) { border-color: rgba(16,185,129,.30); }
  html.ct-dark .ct-content .border-purple-200:not(:is(.print-area, .ct-paper) *) { border-color: rgba(139,92,246,.30); }

  html.ct-dark .ct-content :is(input:not([type=checkbox]):not([type=radio]):not([type=file]):not([type=range]), select, textarea):not(:is(.print-area, .ct-paper) *) {
    background-color: rgba(2,6,23,.55); color: #e2e8f0; border-color: rgba(148,163,184,.22); }
  html.ct-dark .ct-content :is(input, textarea)::placeholder { color: #64748b; }
  html.ct-dark .ct-content :is(input, select, textarea):disabled { background-color: rgba(148,163,184,.08); color: #94a3b8; }
  html.ct-dark .ct-content option { background: #0e1526; color: #e2e8f0; }
  html.ct-dark .ct-content input[type=date]::-webkit-calendar-picker-indicator { filter: invert(.8); }

  /* A document shown on screen (invoice / receipt preview) stays white paper. */
  html.ct-dark .ct-content .print-area { border-radius: 14px; color: #0f172a; padding: 18px; }
}
`;

function ThemeStyles() {
  return <style>{UI_THEME_CSS}</style>;
}

/* ---------------- Sidebar ---------------- */

function Sidebar({ page, setPage, role, onLogout, companyName, logoUrl, open = false, onClose, branchLabel, badges = {} }) {
  const { language } = useLanguage();
  const rtl = language === "ur";
  const groups = NAV_GROUPS
    .map((g) => ({ ...g, items: g.items.filter((it) => !it.adminOnly || role === "admin") }))
    .filter((g) => g.items.length > 0);

  function go(id) {
    setPage(id);
    if (onClose) onClose();
  }

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden transition-opacity print:hidden ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />
      <aside
        className={`fixed inset-y-0 z-50 w-[248px] shrink-0 flex flex-col bg-[#070c17] text-slate-300 border-white/5 transition-transform duration-300 ease-out
          lg:static lg:z-auto lg:translate-x-0 print:hidden ${rtl ? "right-0 border-l" : "left-0 border-r"}
          ${open ? "translate-x-0" : rtl ? "translate-x-full" : "-translate-x-full"}`}
      >
        <div className="h-[72px] px-5 flex items-center gap-3 border-b border-white/5">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="w-10 h-10 rounded-xl object-contain bg-white p-0.5 shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-xl ct-gold-bg ct-display font-black flex items-center justify-center text-[15px] shadow-[0_8px_24px_-8px_rgba(212,169,79,.7)] shrink-0">
              {uiInitials(companyName)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="ct-display text-[15.5px] font-bold text-white leading-tight truncate">{companyName}</div>
            <div className="text-[10px] font-semibold tracking-[.2em] text-[#e9c77b] uppercase">{t("Premium ERP")}</div>
          </div>
          <button type="button" onClick={onClose} className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10" aria-label="Close menu">
            <UiIcon name="x" />
          </button>
        </div>

        {branchLabel && (
          <div className="mx-4 mt-4 flex items-center gap-2.5 rounded-xl bg-white/[.04] border border-white/[.07] px-3 py-2.5">
            <span className="text-emerald-400"><UiIcon name="branch" className="w-4 h-4" /></span>
            <div className="min-w-0">
              <div className="text-[10.5px] text-slate-500 leading-none">{t("Branch")}</div>
              <div className="text-[13px] text-white font-semibold mt-1 truncate">{branchLabel}</div>
            </div>
          </div>
        )}

        <nav className="ct-nav flex-1 overflow-y-auto px-3 py-4 space-y-4">
          {groups.map((g) => (
            <div key={g.title}>
              <div className="px-3 mb-1 text-[10px] font-bold tracking-[.16em] text-slate-500 uppercase">{t(g.title)}</div>
              {g.items.map((it) => {
                const active = page === it.id;
                const badge = badges[it.id];
                return (
                  <button
                    key={it.id}
                    type="button"
                    onClick={() => go(it.id)}
                    aria-current={active ? "page" : undefined}
                    className={`group relative w-full flex items-center gap-3 px-3 py-[7px] rounded-lg text-[13.5px] font-medium transition-all duration-200 text-start
                      ${active ? "text-white bg-gradient-to-r from-emerald-500/20 to-emerald-500/0" : "text-slate-400 hover:text-slate-100 hover:bg-white/[.04]"}`}
                  >
                    {active && <span className="absolute inset-y-1.5 w-[3px] rounded-full bg-emerald-400 shadow-[0_0_12px_#34d399]" style={{ insetInlineStart: 0 }} />}
                    <span className={`transition-colors ${active ? "text-emerald-400" : "text-slate-500 group-hover:text-slate-300"}`}><UiIcon name={it.icon} className="w-[17px] h-[17px]" /></span>
                    <span className="truncate">{t(it.label)}</span>
                    {badge ? (
                      <span className="ms-auto min-w-[20px] text-center text-[10px] font-bold rounded-full px-1.5 py-0.5 bg-rose-500/15 text-rose-300">{badge}</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="m-3 rounded-2xl p-3.5 border border-[#e9c77b]/25 bg-gradient-to-br from-[#e9c77b]/10 to-transparent">
          <div className="flex items-center gap-2 text-[12px] font-bold text-[#e9c77b]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 ct-live" />
            {t(supabase ? "Live data sync" : "Saved on this device")}
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="mt-2.5 w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-[13px] font-medium text-slate-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
          >
            <UiIcon name="logout" className="w-4 h-4" />
            <span>{t("Log out")}</span>
          </button>
        </div>
      </aside>
    </>
  );
}

/* ---------------- Stat card ---------------- */

const STAT_TONE = {
  "text-red-600": "#fb7185", "text-emerald-600": "#34d399", "text-blue-700": "#818cf8",
  "text-amber-600": "#fbbf24", "text-purple-700": "#a78bfa", "text-slate-500": "#64748b",
};

function Stat({ label, value, accent }) {
  const tone = STAT_TONE[accent] || "rgba(148,163,184,.45)";
  return (
    <div className="ct-card ct-lift ct-rise relative p-4 flex-1 min-w-[160px] overflow-hidden">
      <span className="absolute top-3.5 bottom-3.5 w-[3px] rounded-full" style={{ insetInlineStart: 0, background: tone, boxShadow: `0 0 12px ${tone}` }} />
      <div className="text-[12px] font-medium ct-t2 truncate">{label}</div>
      <div className={`ct-display text-[22px] leading-7 font-bold mt-1.5 tabular-nums ${accent || "ct-h"}`}>{value}</div>
    </div>
  );
}

/* ---------------- Modal ----------------
   Escape closes only the top-most modal when modals are stacked. */

const uiModalStack = [];

function Modal({ title, onClose, children, wide }) {
  const idRef = React.useRef(null);
  if (!idRef.current) idRef.current = {};
  const closeRef = React.useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const id = idRef.current;
    uiModalStack.push(id);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape" && uiModalStack[uiModalStack.length - 1] === id && closeRef.current) closeRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      const i = uiModalStack.indexOf(id);
      if (i >= 0) uiModalStack.splice(i, 1);
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  return (
    <div className="ct-modal-back fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/70 p-2 sm:p-6 print:bg-transparent">
      <div
        role="dialog"
        aria-modal="true"
        className={`ct-modal-panel w-full ${wide ? "max-w-4xl" : "max-w-lg"} my-4 sm:my-10 bg-white rounded-[22px] shadow-2xl shadow-black/40 ring-1 ring-slate-900/5 overflow-hidden`}
      >
        <div className="flex items-center justify-between gap-3 px-5 sm:px-6 py-4 border-b border-slate-200">
          <h3 className="ct-display text-[17px] font-bold text-slate-900 truncate">{t(title)}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 -m-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors print:hidden"
            aria-label="Close"
          >
            <UiIcon name="x" className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 sm:p-6">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block mb-4">
      <span className="block text-[12.5px] font-semibold text-slate-600 mb-1.5">{t(label)}</span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm " +
  "transition-colors focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15";

function Btn({ children, onClick, variant = "primary", type = "button", small, disabled }) {
  const base =
    `inline-flex items-center justify-center gap-1.5 rounded-xl font-semibold whitespace-nowrap transition-all duration-150 select-none ` +
    `focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ` +
    `${small ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm"} ` +
    `${disabled ? "opacity-45 cursor-not-allowed" : "active:scale-[.97]"}`;
  const styles = {
    primary: "ct-em-btn hover:brightness-110 focus-visible:ring-emerald-500",
    dark: "ct-keep bg-slate-900 text-white border border-white/10 shadow-sm hover:bg-slate-800 focus-visible:ring-slate-500",
    ghost: "bg-white text-slate-700 border border-slate-300 shadow-sm hover:bg-slate-50 focus-visible:ring-slate-400",
    danger: "bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-[0_10px_24px_-12px_rgba(244,63,94,.8)] hover:brightness-110 focus-visible:ring-red-500",
  };
  return (
    <button type={type} onClick={disabled ? undefined : onClick} disabled={disabled} className={`${base} ${styles[variant] || styles.primary}`}>
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
  const [showPass, setShowPass] = useState(false);

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

  function onSubmit(e) { e.preventDefault(); submit(); }

  const field = "w-full rounded-xl border border-white/10 bg-white/[.04] px-3.5 py-2.5 text-[14px] text-white placeholder:text-slate-500 outline-none transition focus:border-emerald-400/70 focus:ring-4 focus:ring-emerald-400/15";

  return (
    <div className="ct-mesh min-h-screen grid lg:grid-cols-[1.1fr_1fr] text-slate-200" style={{ background: "#060a13" }}>
      <ThemeStyles />
      {/* Brand panel */}
      <div className="hidden lg:flex relative flex-col justify-between p-12 overflow-hidden border-e border-white/5">
        <div className="absolute -top-40 -left-24 w-[34rem] h-[34rem] rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute -bottom-48 right-0 w-[32rem] h-[32rem] rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="relative flex items-center gap-3 ct-rise">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="w-12 h-12 rounded-2xl object-contain bg-white p-1" />
          ) : (
            <div className="w-12 h-12 rounded-2xl ct-gold-bg ct-display font-black text-lg flex items-center justify-center">{uiInitials(companyName)}</div>
          )}
          <div>
            <div className="ct-display text-lg font-bold text-white leading-tight">{companyName}</div>
            <div className="text-[10.5px] font-semibold tracking-[.2em] text-[#e9c77b] uppercase">{t("Premium ERP")}</div>
          </div>
        </div>
        <div className="relative max-w-lg ct-rise" style={{ animationDelay: ".1s" }}>
          <div className="ct-display text-[44px] font-extrabold leading-[1.05] text-white">
            {t("Invoices, ledger, payments and bookings — in one place.")}
          </div>
          <div className="mt-5 text-slate-400">{t("Construction materials · Billing · Ledger")}</div>
          <div className="mt-8 grid grid-cols-3 gap-3 max-w-md">
            {[["file", "Invoices"], ["wallet", "Payments"], ["book", "Ledger"]].map(([ic, l], i) => (
              <div key={l} className="ct-card ct-rise p-3.5" style={{ animationDelay: `${0.2 + i * 0.08}s` }}>
                <span className="text-emerald-400"><UiIcon name={ic} className="w-5 h-5" /></span>
                <div className="mt-2 text-[13px] font-semibold text-white">{t(l)}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative text-xs text-slate-500">© {new Date().getFullYear()} {companyName}</div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm ct-rise">
          <div className="flex justify-end mb-10"><LanguageSwitcher /></div>
          <div className="lg:hidden flex items-center gap-3 mb-8">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="w-11 h-11 rounded-xl object-contain bg-white p-0.5" />
            ) : (
              <div className="w-11 h-11 rounded-xl ct-gold-bg ct-display font-black flex items-center justify-center">{uiInitials(companyName)}</div>
            )}
            <div className="ct-display text-lg font-bold text-white">{companyName}</div>
          </div>
          <h1 className="ct-display text-[28px] font-bold text-white">{t("Log In")}</h1>
          <p className="mt-1 mb-6 text-sm text-slate-400">{t("Sign in to your account")}</p>

          <form onSubmit={onSubmit} className="ct-card p-6">
            <label className="block mb-4">
              <span className="block text-[12.5px] font-semibold text-slate-300 mb-1.5">{t("Username")}</span>
              <input className={field} value={username} onChange={(e) => setUsername(e.target.value)} autoFocus autoComplete="username" />
            </label>
            <label className="block mb-4">
              <span className="block text-[12.5px] font-semibold text-slate-300 mb-1.5">{t("Password")}</span>
              <div className="relative">
                <input type={showPass ? "text" : "password"} className={`${field} pe-11`} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
                <button type="button" onClick={() => setShowPass((v) => !v)} className="absolute inset-y-0 end-0 px-3 text-[11px] font-bold text-slate-400 hover:text-white">
                  {showPass ? "HIDE" : "SHOW"}
                </button>
              </div>
            </label>
            {error && (
              <div className="mb-4 rounded-xl bg-rose-500/10 border border-rose-400/30 px-3 py-2 text-sm font-medium text-rose-300">{t(error)}</div>
            )}
            <button type="submit" className="ct-em-btn w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold hover:brightness-110 active:scale-[.99] transition">
              <UiIcon name="lock" className="w-4 h-4" />
              {t("Log In")}
            </button>
            {failCount >= 1 && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <button type="button" onClick={resetDefaults} className="text-xs font-semibold text-emerald-400 hover:underline">
                  Login nahi ho raha? Default logins reset karein
                </button>
                {resetMsg && <div className="text-emerald-300 text-xs font-medium mt-2">{t(resetMsg)}</div>}
              </div>
            )}
          </form>
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
    .forEach((p) => {
      // Advance Booking upgrade: a booking advance is a CREDIT (money in);
      // a booking refund is a DEBIT (money paid back to the customer).
      if (p.kind === "Refund") {
        entries.push({ date: p.date, type: "Booking Refund", ref: p.bookingCode || p.method || "Cash", debit: p.amount, credit: 0, id: p.id, note: p.note });
        return;
      }
      if (p.bookingId) {
        entries.push({ date: p.date, type: "Booking Advance", ref: p.bookingCode || p.method || "Cash", debit: 0, credit: p.amount, id: p.id });
        return;
      }
      entries.push({ date: p.date, type: p.promiseId ? "Payment Against Promise" : "Payment", ref: p.promiseId ? (promises.find((pr) => pr.id === p.promiseId)?.code || p.method || "Cash") : (p.method || "Cash"), debit: 0, credit: p.amount, id: p.id });
    });
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

/* ---------------- Outstanding for many customers (performance) ----------------
   Gives exactly the same numbers as calling computeLedgerForCustomer for each
   customer, but groups every table by customer ONCE first. Before, every
   customer's ledger scanned every invoice/payment/return/... in the business,
   so Dashboard / Customers / Reports slowed down as data grew (and the
   Customers list recomputed everything on every keystroke in the search box).
   Payments linked to a cancelled invoice are removed up front using the FULL
   invoice list, so the result is identical to the original per-customer check.
   Use it only where the outstanding NUMBER is needed (not ledger lines). */
function computeOutstandingByCustomer(customers, invoices, payments, returns = [], exchanges = [], promises = [], transfers = [], adjustments = []) {
  const invById = new Map();
  const invByNumber = new Map();
  (invoices || []).forEach((i) => {
    if (!invById.has(i.id)) invById.set(i.id, i);
    if (!invByNumber.has(i.number)) invByNumber.set(i.number, i);
  });
  const linkedToCancelled = (p) => {
    if (p.invoiceId) {
      const inv = invById.get(p.invoiceId);
      return !!inv && isInvoiceCancelled(inv);
    }
    if (p.note && p.note.startsWith("Against ")) {
      const inv = invByNumber.get(p.note.replace("Against ", "").trim());
      return !!inv && isInvoiceCancelled(inv);
    }
    return false;
  };
  const groupBy = (list, ...fields) => {
    const map = new Map();
    (list || []).forEach((rec) => {
      new Set(fields.map((f) => rec[f])).forEach((id) => {
        let arr = map.get(id);
        if (!arr) { arr = []; map.set(id, arr); }
        arr.push(rec);
      });
    });
    return map;
  };
  const inv = groupBy(invoices, "customerId");
  // Decided here against the FULL invoice list (exactly like the original).
  // The kept payments are passed on with their invoice link cleared, so the
  // per-customer ledger cannot re-match a legacy "Against <number>" note to a
  // different invoice that happens to share the same number. invoiceId / note
  // play no other part in the outstanding balance.
  const pay = groupBy(
    (payments || [])
      .filter((p) => !linkedToCancelled(p))
      .map((p) => (p.invoiceId || (p.note && p.note.startsWith("Against ")) ? { ...p, invoiceId: "", note: "" } : p)),
    "customerId"
  );
  const ret = groupBy(returns, "customerId");
  const exch = groupBy(exchanges, "customerId");
  const prom = groupBy(promises, "customerId");
  const tr = groupBy(transfers, "fromCustomerId", "toCustomerId");
  const adj = groupBy(adjustments, "customerId");
  const none = [];
  const out = {};
  (customers || []).forEach((c) => {
    out[c.id] = computeLedgerForCustomer(
      c, inv.get(c.id) || none, pay.get(c.id) || none, ret.get(c.id) || none, exch.get(c.id) || none,
      prom.get(c.id) || none, tr.get(c.id) || none, adj.get(c.id) || none
    ).outstanding;
  });
  return out;
}

/* ---------------- Invoice Return/Exchange status helpers (Phase 2 upgrade) ---------------- */

// Returns the list of active (non-deleted) Sales Returns for an invoice.
function returnsForInvoice(invoiceId, returns) {
  return returns.filter((r) => r.invoiceId === invoiceId && r.status !== "Deleted");
}
// Returns the list of active (non-deleted) Exchanges for an invoice.
function exchangesForInvoice(invoiceId, exchanges) {
  return exch
