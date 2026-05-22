# 🚀 NextGen CRM & Cloud Network Simulator

Ushbu loyiha BTEC "Unit 6: Cloud Networking" topshirig'i doirasida kiyim-kechak ulgurji savdo kompaniyasining tizimlarini bulutga migratsiya qilish jarayonini ko'rsatuvchi interaktiv **Java Spring Boot CRM Tizimi va Bulut Infratuzilmasi Simulyatori** hisoblanadi.

Tizim PostgreSQL ma'lumotlar bazasi bilan ishlaydi va o'ta premium glassmorphic dark-neon dizayndagi frontendga ega.

---

## 🛠️ Mahalliy Kompyuterda Ishga Tushirish Yo'riqnomasi

Loyihani ishga tushirish uchun kompyuteringizda **Java (JDK 17+)**, **Maven** va **PostgreSQL** o'rnatilgan bo'lishi lozim.

### 1-qadam: PostgreSQL Ma'lumotlar Bazasini Sozlash
1. PostgreSQL boshqaruv paneliga (masalan, pgAdmin) kiring yoki SQL shell orqali quyidagi buyruqni ishga tushiring:
   ```sql
   CREATE DATABASE crm_db;
   ```
2. `src/main/resources/application.properties` fayliga kiring va PostgreSQL login/parolingizni sozlang:
   ```properties
   spring.datasource.url=jdbc:postgresql://localhost:5432/crm_db
   spring.datasource.username=sizning_postgres_username
   spring.datasource.password=sizning_postgres_parolingiz
   ```

### 2-qadam: Loyihani Build va Run Qilish
Loyiha papkasi (`cloud-crm-portal`) ichiga terminal orqali kiring va quyidagi buyruqlarni bering:

* **Maven orqali loyihani ishga tushirish:**
  ```bash
  mvn clean spring-boot:run
  ```
* **Agar sizda Maven global o'rnatilmagan bo'lsa (Wrapper yordamida Windows-da):**
  ```bash
  .\mvnw spring-boot:run
  ```

Dastur muvaffaqiyatli ishga tushgandan so'ng, brauzerda quyidagi manzilni oching:
👉 **[http://localhost:8080](http://localhost:8080)**

---

## 🐳 Docker Yordamida Ishga Tushirish

Loyihani Docker konteyneriga o'rab, ma'lumotlar bazasi bilan birga ishga tushirish juda qulay.

1. Baza va dasturni birgalikda ishga tushirish uchun loyiha papkasida docker-compose.yml faylini yaratib, `docker-compose up --build` buyrug'ini berishingiz mumkin.
2. Yoki faqat Spring Boot loyihasining o'zini Docker orqali build qilish:
   ```bash
   docker build -t cloud-crm -f Dockerfile .
   docker run -p 8080:8080 -e SPRING_DATASOURCE_URL=jdbc:postgresql://host.docker.internal:5432/crm_db cloud-crm
   ```

---

## ☁️ Bulutga Deploy Qilish (Render yoki Railway)

Loyiha tayyor Dockerfile-ga ega bo'lganligi sababli, uni Render yoki Railway-ga bir necha qadamda deploy qilish mumkin:

### Render.com orqali deploy qilish:
1. Loyiha kodlarini shaxsiy **GitHub** repozitoriyangizga yuklang (`git push`).
2. [Render.com](https://render.com) saytida ro'yxatdan o'ting.
3. Yangi **Web Service** qo'shing va GitHub repozitoriyangizni ulang.
4. **Environment** bo'limida quyidagi sozlamalarni kiriting:
   - **Runtime**: `Docker` (Render loyiha ichidagi Dockerfile-ni avtomatik topib, o'zi build qiladi!)
   - **Environment Variables**:
     - `SPRING_DATASOURCE_URL` = `jdbc:postgresql://<sizning_cloud_db_host>/crm_db` (Render-da bepul PostgreSQL bazasini ham 1 daqiqada ochishingiz va uning url manzilini shu yerga yozishingiz mumkin)
     - `SPRING_DATASOURCE_USERNAME` = `postgres_db_user`
     - `SPRING_DATASOURCE_PASSWORD` = `postgres_db_password`
5. **Deploy** tugmasini bosing. 2-3 daqiqadan so'ng sizga dunyo bo'yicha istalgan joydan kirish mumkin bo'lgan bepul `https://loyiha-nomi.onrender.com` havola beriladi!

---

## 🎯 BTEC Kriteriyalarini Dastur Orqali Himoya Qilish (O'qituvchiga Namoyish)

Baholovchi topshiriqni tekshirayotganda dasturiy interfeysdagi **"Tarmoq Monitori" (Network Monitor)** bo'limini ochib quyidagilarni ko'rsatishingiz mumkin:

1. **VPC Arxitekturasi (C.P5, C.P6):** Topologiya xaritasida butun tarmoq AWS VPC doirasida public subnet (Load Balancer, Web so'rovlar) va private subnetlarga (CRM Instances va PostgreSQL ma'lumotlar bazasi xavfsizligi) ajratilganligi. Baza internetdan to'liq uzilgan va faqat CRM tizimi orqaligina unga kirish mumkin (High Security).
2. **VPN Tunnel (B.P4):** Bosh ofis bilan o'rnatilgan shifrlangan Site-to-Site VPN kanali.
3. **Load Balancing va Auto-Scaling (C.M3, D.P8):** "300 so'rov yuborish" tugmasini bosing. CPU yuklamasi oshganligini, so'rovlar Load Balancer tomonidan virtual serverlar o'rtasida real-vaqtda qanday taqsimlanayotganini va CPU 75% dan oshganda Auto-scaling ishga tushib, avtomatik yangi server (`CRM-Instance-2` va h.k.) qo'shilayotganini ko'rsating.
4. **Tarmoq Unumdorligi Sinovi (D.M4, D.P7):** "Ping testini boshlash" tugmasini bosib, latency (RTT kechikish vaqti) va throughput (o'tkazuvchanlik) grafiklarini real vaqtda tahlil qilib bering.
