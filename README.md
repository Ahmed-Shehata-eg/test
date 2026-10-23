# منصة الأستاذ أحمد شحاتة لتعليم اللغة العربية

موقع عربي باتجاه RTL لطلاب المرحلة الابتدائية والإعدادية والثانوية في مصر.

## الموجود حاليًا

- صفحة رئيسية عربية متجاوبة.
- أقسام للمراحل الدراسية الثلاث.
- نافذة طلب اشتراك تجريبية مع اختيار الصف.
- أسئلة شائعة وقسم لطريقة التعلّم.
- ملفات الواجهة: `index.html` و`style.css` و`script.js`.
- صورة الأستاذ: `ahmed-shehata.jpeg`.

## تشغيل النسخة الحالية

افتح `index.html` في المتصفح، أو شغّل خادم ملفات ثابتة محليًا من مجلد المشروع. لا تحتاج النسخة الحالية إلى تثبيت حزم.

## تنبيه مهم حول حالة الاشتراكات

نموذج الاشتراك الحالي للمعاينة فقط: لا يحفظ بيانات الطالب، ولا يرسل الطلب إلى الأستاذ، ولا يعالج أي مدفوعات. لا ينبغي الإعلان عن الدفع الإلكتروني على أنه مفعّل قبل ربط خادم آمن وبوابة دفع والتحقق من المعاملات.

## خطة التطوير

1. تنظيم الكورسات والصفوف الاثني عشر: الأول إلى السادس الابتدائي، والأول إلى الثالث الإعدادي، والأول إلى الثالث الثانوي.
2. إنشاء تسجيل دخول آمن للطلاب ولوحة إدارة للأستاذ.
3. تصميم قاعدة بيانات للطلاب والصفوف والكورسات والدروس والامتحانات والاشتراكات.
4. ربط استضافة فيديو مناسبة مع التحكم في الوصول للمحتوى المدفوع.
5. ربط بوابة دفع تدعم مصر، والتحقق من الدفع من جهة الخادم عبر إشعارات موثوقة.
6. إضافة اختبارات آلية، وإعدادات الخصوصية، والنسخ الاحتياطي، ومراقبة الأخطاء قبل الإطلاق.

## ملاحظات أمنية

- لا تخزّن أرقام البطاقات أو كلمات المرور في ملفات الواجهة.
- لا تضع مفاتيح سرية أو بيانات اعتماد في Git.
- يجب أن يتحقق الخادم من صلاحية الاشتراك قبل إتاحة أي درس مدفوع.
- اجمع أقل قدر ممكن من بيانات الطلاب، وراعِ خصوصية القاصرين.
- يجب مراجعة بيانات الاتصال وطرق الدفع المنشورة والتأكد من أنها صحيحة ومصرّح باستخدامها قبل إطلاق الموقع.

## التقنية المقترحة للمرحلة الإنتاجية

يمكن نقل المشروع تدريجيًا إلى واجهة Next.js وTypeScript، مع PostgreSQL/Supabase للمصادقة والبيانات، وخدمة فيديو محمية، وبوابة دفع مصرية مناسبة. تُحسم التفاصيل بعد تحديد متطلبات الأستاذ وحجم الاستخدام وتكاليف الخدمات.


## Authentication and online payments

- Student authentication is being migrated from an unconfigured Supabase placeholder to the selected Clerk application.
- The static frontend uses Clerk's browser SDK. Authentication will not work until the Clerk Publishable Key is configured and phone/password sign-in options are enabled in the Clerk Dashboard.
- Follow [the Clerk and EasyKash setup guide](docs/GOOGLE_AUTH_EASYKASH_SETUP.md). Never place a Clerk Secret Key in browser JavaScript or GitHub.
- EasyKash checkout is **not live yet**. Production payment processing must use EasyKash's official merchant API documentation and server-side credential storage. A redirect alone must never unlock a course.
