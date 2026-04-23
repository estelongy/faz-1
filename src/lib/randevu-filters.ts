// Branşlar
export const BRANCHES = [
  'Plastik, Rekonstrüktif ve Estetik Cerrahi',
  'Dermatoloji / Cildiye',
  'Kulak Burun Boğaz (KBB)',
  'Göz Hastalıkları',
  'Medikal Estetik',
  'Genital Estetik (Jinekoloji)',
  'Genital Estetik (Üroloji)',
  'Fonksiyonel Tıp ve Longevity',
  'Obezite ve Metabolizma',
  'Diş Hekimliği ve Ağız Estetiği',
]

// Tedaviler / Uygulamalar (branşa göre)
export const TREATMENTS_BY_BRANCH: Record<string, string[]> = {
  'Plastik, Rekonstrüktif ve Estetik Cerrahi': [
    'Rinoplasti', 'Septorinoplasti', 'Ameliyatsız Burun Dolgusu',
    'Yüz Germe', 'Boyun Germe', 'Kaş Kaldırma', 'Alın Germe',
    'Göz Kapağı Estetiği (Blefaroplasti)', 'Kepçe Kulak (Otoplasti)',
    'Çene Estetiği', 'Çene İmplantı', 'Elmacık Kemiği Estetiği',
    'Elmacık İmplantı', 'Yanak Dolgusu', 'Yağ Enjeksiyonu (Lipofilling)',
    'Yüz Yağ Transferi', 'Botoks', 'Hyalüronik Asit Dolgu', 'PRP',
    'Mezoterapi', 'Kimyasal Peeling', 'Lazer Peeling', 'İp Askı (Thread Lift)',
    'Meme Büyütme', 'Meme Küçültme', 'Meme Dikleştirme (Mastopeksi)',
    'Meme Rekonstrüksiyonu', 'Jinekomasti', 'Meme Ucu Estetiği',
    'Areola Düzeltme', 'Liposuction', 'Vaser Liposuction', 'HD Liposuction',
    'Karın Germe (Abdominoplasti)', 'Kol Germe (Brachioplasti)',
    'Bacak Germe', 'Uyluk Germe', 'Kalça Estetiği',
    'Brazilian Butt Lift (BBL)', 'Pektoral İmplant', 'Baldır İmplantı',
    'Six-Pack Estetiği', 'Annelik Estetiği (Mommy Makeover)',
    'Yara İzi Tedavisi', 'Keloid Tedavisi', 'Yanık Tedavisi', 'Ben Aldırma',
    'Cilt Tümörü Eksizyonu', 'Cilt Kanseri Cerrahisi',
    'Kronik Yara Tedavisi', 'El Travması Tedavisi', 'Tendon Onarımı',
    'Sinir Onarımı', 'El Tümörleri', 'Yapışık Parmak (Sindaktili)',
    'Fazla Parmak (Polidaktili)', 'Karpal Tünel Sendromu',
    'Ortognatik Cerrahi', 'Yarık Dudak-Damak Onarımı',
    'Yüz Kemikleri Kırık Tamiri', 'Baş-Boyun Rekonstrüksiyonu',
  ],
  'Dermatoloji / Cildiye': [
    'Botoks', 'Hyalüronik Asit Dolgu', 'Dudak Dolgusu', 'Yanak Dolgusu',
    'Göz Altı Dolgusu', 'Çene Dolgusu', 'Jawline Dolgusu', 'Alın Dolgusu',
    'PRP', 'Mezoterapi', 'Profhilo', 'Skinvive', 'NucleoFill',
    'Biostimulan Dolgu', 'Gençlik Aşısı', 'Altın Eksozom', 'Karboksiterapi',
    'Fraksiyonel Lazer', 'Nd:YAG Lazer', 'Q-Switch Lazer', 'Er:YAG Lazer',
    'IPL', 'BBL', 'Karbon Peeling Lazeri', 'Kılcal Damar Lazeri',
    'Lazer Epilasyon', 'Lazer Dövme Silme', 'Lazer Leke Tedavisi',
    'Tırnak Mantarı Lazer Tedavisi', 'HIFU', 'Thermage', 'Sofwave',
    'Radyofrekans (RF)', 'Altın İğne RF', 'Dermapen', 'AquaPeel',
    'HydraFacial', 'Soğuk Lipoliz', 'Fototerapi', 'Elektrokoterizasyon',
    'Kimyasal Peeling', 'Mikrodermabrazyon', 'Karbon Peeling',
    'İp Askı (Thread Lift)', '8 Nokta Lifting', 'Ben Aldırma',
    'Siğil Tedavisi', 'Kist Eksizyonu', 'Akne İzi Tedavisi',
    'Yara İzi Tedavisi', 'Keloid Tedavisi', 'Leke Tedavisi',
    'Akne Tedavisi', 'Rozase Tedavisi', 'Vitiligo Tedavisi',
    'Sedef (Psoriasis) Tedavisi', 'Egzama Tedavisi', 'Melazma Tedavisi',
    'Saç Dökülmesi Tedavisi', 'PRP Saç Tedavisi', 'Saç Mezoterapisi',
    'Tırnak Hastalıkları Tedavisi', 'Dermatoskopi', 'Cilt Analizi',
    'Medikal Cilt Bakımı',
  ],
  'Kulak Burun Boğaz (KBB)': [
    'Rinoplasti', 'Septorinoplasti', 'Ameliyatsız Burun Dolgusu',
    'Burun Ucu Estetiği', 'Kepçe Kulak (Otoplasti)',
    'Kulak Memesi Düzeltme', 'Kulak Estetiği',
    'Göz Kapağı Estetiği (Blefaroplasti)', 'Kaş Kaldırma',
    'Yüz Germe (Facelift)', 'Boyun Germe', 'Botoks',
    'Dolgu Uygulamaları', 'Lazer Tedavileri', 'Radyofrekans Ablasyon',
    'Horlama Tedavisi', 'Uyku Apnesi Cerrahisi', 'Burun Eti Küçültme',
    'Sinüs Cerrahisi', 'Balon Sinoplasti', 'Endoskopik Sinüs Cerrahisi',
    'Burun Kemiği Düzeltme (Septoplasti)', 'Ses Teli Estetiği',
    'Ses Teli Polip ve Nodül Tedavisi', 'Lazer Bademcik Küçültme',
    'Bademcik Ameliyatı (Tonsillektomi)',
    'Geniz Eti Ameliyatı (Adenoidektomi)',
    'Kulak Zarı Onarımı (Timpanoplasti)', 'İp Askı (Thread Lift)',
    'Yüz Plastik ve Rekonstrüktif Cerrahi',
  ],
  'Göz Hastalıkları': [
    'Üst Göz Kapağı Estetiği (Blefaroplasti)',
    'Alt Göz Kapağı Estetiği (Blefaroplasti)',
    'Göz Altı Dolgusu', 'Göz Altı Işık Dolgusu',
    'Göz Çevresi Botoks', 'Kazayağı Botoks',
    'Göz Altı PRP', 'Göz Altı Mezoterapi',
    'Göz Kapağı Düşüklüğü Tedavisi (Pitoz)',
    'Göz Kapağı Lazer Tedavisi', 'Göz Büyütme Estetiği',
    'Badem Göz Estetiği', 'Göz Altı Torbası Tedavisi',
    'Göz Altı Morluğu Tedavisi', 'Kaş Kaldırma (Göz Çevresi)',
    'Göz Çevresi Dolgu', 'Göz Çevresi Lazer Gençleştirme',
    'Göz Çevresi PRP', 'Göz Çevresi İp Askı',
    'Göz Kapağı Radyofrekans', 'Göz Kapağı Kimyasal Peeling',
    'Göz Lazer (Miyop, Hipermetrop, Astigmat)',
    'Göz Kapağı Yağ Torbası Alımı',
  ],
  'Medikal Estetik': [
    'Botoks', 'Alın Botoksu', 'Kaş Arası Botoks',
    'Göz Çevresi Botoks', 'Boyun Botoksu (Nefertiti)',
    'Diş Sıkma Botoksu (Bruksizm)', 'Terlememe Botoksu',
    'Hyalüronik Asit Dolgu', 'Dudak Dolgusu', 'Yanak Dolgusu',
    'Göz Altı Dolgusu', 'Çene Dolgusu', 'Jawline Dolgusu',
    'Alın Dolgusu', 'Burun Dolgusu', 'Nasolabial Dolgu',
    'Marionette Dolgu', 'El Sırtı Dolgusu', 'Boyun Dolgusu',
    'Dekolte Dolgusu', 'Şakak Dolgusu', 'PRP', 'Mezoterapi',
    'Saç Mezoterapisi', 'Profhilo', 'Skinvive', 'NucleoFill',
    'Biostimulan Dolgu', 'Gençlik Aşısı', 'Altın Eksozom',
    'Karboksiterapi', 'HIFU (Ultherapy)', 'Thermage', 'Sofwave',
    'Radyofrekans (RF)', 'Altın İğne RF', 'Dermapen', 'AquaPeel',
    'HydraFacial', 'İp Askı (Thread Lift)', '8 Nokta Lifting',
    'Sıvı Yüz Germe', 'Fraksiyonel Lazer', 'IPL', 'BBL',
    'Karbon Peeling', 'Kimyasal Peeling', 'Lazer Epilasyon',
    'Soğuk Lipoliz', 'Medikal Cilt Bakımı',
  ],
  'Genital Estetik (Jinekoloji)': [
    'Labiaplasti (İç Dudak Küçültme)', 'Labia Majora Dolgusu',
    'Vajinoplasti (Vajina Daraltma)', 'Klitoral Hudoplasti',
    'Monsplasti (Mons Pubis Estetiği)',
    'Perineoplasti (Doğum İzi Estetiği)', 'Himen Rekonstrüksiyonu',
    'Vajinal Lazer Gençleştirme', 'Vajinal Radyofrekans', 'Vajinal PRP',
    'Orgazm Aşısı (O-Shot)', 'Vajinal Dolgu', 'Vajinal Beyazlatma',
    'Vajinal Kuruluk Tedavisi', 'İdrar Kaçırma Lazer Tedavisi',
    'Genital Bölge Lazer Epilasyon', 'Genital Bölge Lazer Beyazlatma',
    'Otolog Yağ Transferi (Genital)', 'Genital Bölge PRP',
    'Cinsel İşlev Bozukluğu Tedavisi',
  ],
  'Genital Estetik (Üroloji)': [
    'Penis Büyütme', 'Penis Uzatma', 'Penis Kalınlaştırma',
    'Penis Eğriliği Tedavisi (Peyronie)', 'P-Shot (Priapus Shot)',
    'Stem Shot', 'Penil ESWT', 'Skrotum Estetiği', 'Skrotum Germe',
    'Erkek Genital Bölge Lazer Epilasyon',
    'Erkek Genital Bölge Beyazlatma', 'Sünnet Estetiği',
    'Jinekomasti (Erkek Meme)', 'Erektil Disfonksiyon Tedavisi',
    'Erken Boşalma Tedavisi', 'Testis Protezi',
    'Saç Ekimi (PRP Destekli)', 'Erkek PRP Tedavisi',
    'Erkek Botoks (Terlememe)', 'Erkek Dolgu Uygulamaları',
  ],
  'Fonksiyonel Tıp ve Longevity': [
    'Biyolojik Yaş Testi', 'Telomer Analizi',
    'Kapsamlı Kan Tetkiki (100+ Biyobelirteç)', 'Genetik Test',
    'Mikrobiyom Analizi', 'Hormon Paneli', 'Metabolomik Panel',
    'Gıda İntolerans Testi', 'Ağır Metal Testi', 'Epigenetik Analiz',
    'Hormon Replasman Tedavisi', 'Biyoeşdeğer Hormon Tedavisi',
    'IV Vitamin Tedavisi', 'IV Glutatyon Tedavisi', 'IV NAD+ Tedavisi',
    'IV Alfa Lipoik Asit', 'IV Vitamin C', 'Ozon Terapisi',
    'Şelasyon Tedavisi', 'Kök Hücre Tedavisi', 'Eksozom Tedavisi',
    'PRP (Rejeneratif)', 'Peptit Tedavileri', 'Geroprotektör Tedaviler',
    'Kırmızı Işık Terapisi', 'Kriyoterapi',
    'Hiperbolik Oksijen Tedavisi', 'Nöral Terapi', 'Akupunktur',
    'Kişiye Özel Beslenme Planı', 'İntermittent Fasting Protokolü',
    'Kişiye Özel Egzersiz Protokolü', 'Uyku Optimizasyonu',
    'Stres Yönetimi Protokolü', 'Detoks Protokolü',
    'Takviye ve Vitamin Protokolü', 'Bağırsak Sağlığı Tedavisi',
    'Bağışıklık Sistemi Güçlendirme', 'Mitokondri Destek Tedavisi',
    'Longevity Check-Up',
  ],
  'Obezite ve Metabolizma': [
    'Tüp Mide (Sleeve Gastrektomi)', 'Gastrik Bypass',
    'Mini Gastrik Bypass', 'Duodenal Switch', 'Transit Bipartition',
    'Revizyon Cerrahisi', 'Mide Balonu', 'Mide Botoksu',
    'Endoskopik Sleeve Gastroplasti (ESG)',
    'İlaç Destekli Zayıflama (GLP-1 Agonistleri)',
    'İnsülin Direnci Tedavisi', 'Metabolik Check-Up',
    'Kişiye Özel Diyet Programı', 'Kişiye Özel Egzersiz Programı',
    'Soğuk Lipoliz (CoolSculpting)', 'Radyofrekans Lipoliz',
    'Ultrason Lipoliz (HIFU Body)', 'Lazer Lipoliz',
    'Mezoterapi (Bölgesel Yağ)', 'Karboksiterapi', 'Selülit Tedavisi',
    'LPG Endermoloji', 'Vücut Sarma Tedavisi',
    'Vücut Kompozisyon Analizi', 'Metabolik Hız Ölçümü',
    'Hormon Paneli', 'İnsülin Direnci Testi',
    'Kapsamlı Metabolik Panel',
  ],
  'Diş Hekimliği ve Ağız Estetiği': [
    'Gülüş Tasarımı (Smile Design)', 'Hollywood Smile',
    'Dijital Gülüş Tasarımı', 'Diş Beyazlatma (Bleaching)',
    'Lamine Veneer (Yaprak Porselen)', 'Zirkonyum Kaplama',
    'Porselen Kaplama', 'Kompozit Bonding', 'Estetik Dolgu',
    'Diş İmplantı', 'All-on-4 İmplant', 'All-on-6 İmplant',
    'Diş Eti Estetiği (Gummy Smile)', 'Diş Eti Düzeltme (Gingivektomi)',
    'Pembe Estetik', 'Diş Eti Şekillendirme',
    'Diş Eti Pigmentasyon Tedavisi', 'Ortodonti (Metal Braket)',
    'Seramik Braket', 'Şeffaf Plak (İnvisalign)', 'Lingual Ortodonti',
    'Diş Teli Tedavisi', 'Kanal Tedavisi (Endodonti)',
    'Gömülü Diş Operasyonu', 'Diş Çekimi', 'Sinüs Lift', 'Kemik Grefti',
    'Diş Proteezi', 'Hareketli Protez', 'Sabit Protez (Köprü)',
    'Temporomandibular Eklem (TME) Tedavisi',
    'Diş Gıcırdatma (Bruksizm) Tedavisi', 'Gece Plağı',
    'Çene Eklemi Cerrahisi', 'Ağız İçi Lazer Tedavileri',
    'Diş PRP Tedavisi',
  ],
}

export const ALL_TREATMENTS: string[] = Array.from(
  new Set(Object.values(TREATMENTS_BY_BRANCH).flat())
).sort((a, b) => a.localeCompare(b, 'tr'))

// Türkiye il / ilçe listesi
export const LOCATIONS: string[] = [
  // Adana
  'Adana', 'Adana, Seyhan', 'Adana, Çukurova', 'Adana, Yüreğir', 'Adana, Ceyhan', 'Adana, Kozan', 'Adana, Sarıçam',
  // Adıyaman
  'Adıyaman', 'Adıyaman, Merkez', 'Adıyaman, Kahta',
  // Afyonkarahisar
  'Afyonkarahisar', 'Afyonkarahisar, Merkez',
  // Ağrı
  'Ağrı', 'Ağrı, Merkez',
  // Aksaray
  'Aksaray', 'Aksaray, Merkez',
  // Amasya
  'Amasya', 'Amasya, Merkez',
  // Ankara
  'Ankara', 'Ankara, Çankaya', 'Ankara, Keçiören', 'Ankara, Yenimahalle', 'Ankara, Mamak',
  'Ankara, Etimesgut', 'Ankara, Sincan', 'Ankara, Altındağ', 'Ankara, Pursaklar', 'Ankara, Gölbaşı',
  'Ankara, Kazan', 'Ankara, Polatlı', 'Ankara, Elmadağ', 'Ankara, Beypazarı', 'Ankara, Çubuk',
  'Ankara, Kızılcahamam', 'Ankara, Nallıhan', 'Ankara, Haymana',
  // Antalya
  'Antalya', 'Antalya, Muratpaşa', 'Antalya, Kepez', 'Antalya, Konyaaltı', 'Antalya, Alanya',
  'Antalya, Manavgat', 'Antalya, Serik', 'Antalya, Aksu', 'Antalya, Döşemealtı', 'Antalya, Kemer',
  'Antalya, Kaş', 'Antalya, Finike', 'Antalya, Kumluca', 'Antalya, Gazipaşa',
  // Ardahan
  'Ardahan', 'Ardahan, Merkez',
  // Artvin
  'Artvin', 'Artvin, Merkez',
  // Aydın
  'Aydın', 'Aydın, Efeler', 'Aydın, Kuşadası', 'Aydın, Didim', 'Aydın, Nazilli', 'Aydın, Söke', 'Aydın, Çine',
  // Balıkesir
  'Balıkesir', 'Balıkesir, Altıeylül', 'Balıkesir, Karesi', 'Balıkesir, Bandırma', 'Balıkesir, Edremit', 'Balıkesir, Burhaniye', 'Balıkesir, Ayvalık',
  // Bartın
  'Bartın', 'Bartın, Merkez',
  // Batman
  'Batman', 'Batman, Merkez',
  // Bayburt
  'Bayburt', 'Bayburt, Merkez',
  // Bilecik
  'Bilecik', 'Bilecik, Merkez', 'Bilecik, Bozüyük',
  // Bingöl
  'Bingöl', 'Bingöl, Merkez',
  // Bitlis
  'Bitlis', 'Bitlis, Merkez',
  // Bolu
  'Bolu', 'Bolu, Merkez',
  // Burdur
  'Burdur', 'Burdur, Merkez',
  // Bursa
  'Bursa', 'Bursa, Osmangazi', 'Bursa, Nilüfer', 'Bursa, Yıldırım', 'Bursa, Gemlik',
  'Bursa, İnegöl', 'Bursa, Mudanya', 'Bursa, Kestel', 'Bursa, Gürsu', 'Bursa, Karacabey', 'Bursa, Mustafakemalpaşa',
  // Çanakkale
  'Çanakkale', 'Çanakkale, Merkez', 'Çanakkale, Biga', 'Çanakkale, Gelibolu', 'Çanakkale, Çan',
  // Çankırı
  'Çankırı', 'Çankırı, Merkez',
  // Çorum
  'Çorum', 'Çorum, Merkez',
  // Denizli
  'Denizli', 'Denizli, Pamukkale', 'Denizli, Merkezefendi', 'Denizli, Çivril', 'Denizli, Acıpayam',
  // Diyarbakır
  'Diyarbakır', 'Diyarbakır, Bağlar', 'Diyarbakır, Kayapınar', 'Diyarbakır, Sur', 'Diyarbakır, Yenişehir', 'Diyarbakır, Bismil',
  // Düzce
  'Düzce', 'Düzce, Merkez',
  // Edirne
  'Edirne', 'Edirne, Merkez', 'Edirne, Keşan', 'Edirne, Uzunköprü',
  // Elazığ
  'Elazığ', 'Elazığ, Merkez',
  // Erzincan
  'Erzincan', 'Erzincan, Merkez',
  // Erzurum
  'Erzurum', 'Erzurum, Yakutiye', 'Erzurum, Palandöken', 'Erzurum, Aziziye',
  // Eskişehir
  'Eskişehir', 'Eskişehir, Odunpazarı', 'Eskişehir, Tepebaşı',
  // Gaziantep
  'Gaziantep', 'Gaziantep, Şahinbey', 'Gaziantep, Şehitkamil', 'Gaziantep, Nizip', 'Gaziantep, İslahiye',
  // Giresun
  'Giresun', 'Giresun, Merkez',
  // Gümüşhane
  'Gümüşhane', 'Gümüşhane, Merkez',
  // Hakkari
  'Hakkari', 'Hakkari, Merkez',
  // Hatay
  'Hatay', 'Hatay, Antakya', 'Hatay, İskenderun', 'Hatay, Defne', 'Hatay, Dörtyol', 'Hatay, Reyhanlı', 'Hatay, Samandağ',
  // Iğdır
  'Iğdır', 'Iğdır, Merkez',
  // Isparta
  'Isparta', 'Isparta, Merkez',
  // İstanbul
  'İstanbul',
  'İstanbul, Adalar', 'İstanbul, Arnavutköy', 'İstanbul, Ataşehir', 'İstanbul, Avcılar',
  'İstanbul, Bağcılar', 'İstanbul, Bahçelievler', 'İstanbul, Bakırköy', 'İstanbul, Başakşehir',
  'İstanbul, Bayrampaşa', 'İstanbul, Beşiktaş', 'İstanbul, Beykoz', 'İstanbul, Beylikdüzü',
  'İstanbul, Beyoğlu', 'İstanbul, Büyükçekmece', 'İstanbul, Çatalca', 'İstanbul, Çekmeköy',
  'İstanbul, Esenler', 'İstanbul, Esenyurt', 'İstanbul, Eyüpsultan', 'İstanbul, Fatih',
  'İstanbul, Gaziosmanpaşa', 'İstanbul, Güngören', 'İstanbul, Kadıköy', 'İstanbul, Kağıthane',
  'İstanbul, Kartal', 'İstanbul, Küçükçekmece', 'İstanbul, Maltepe', 'İstanbul, Pendik',
  'İstanbul, Sancaktepe', 'İstanbul, Sarıyer', 'İstanbul, Silivri', 'İstanbul, Sultanbeyli',
  'İstanbul, Sultangazi', 'İstanbul, Şile', 'İstanbul, Şişli', 'İstanbul, Tuzla',
  'İstanbul, Ümraniye', 'İstanbul, Üsküdar', 'İstanbul, Zeytinburnu',
  // İzmir
  'İzmir',
  'İzmir, Aliağa', 'İzmir, Balçova', 'İzmir, Bayındır', 'İzmir, Bayraklı', 'İzmir, Bergama',
  'İzmir, Bornova', 'İzmir, Buca', 'İzmir, Çeşme', 'İzmir, Çiğli', 'İzmir, Dikili',
  'İzmir, Foça', 'İzmir, Gaziemir', 'İzmir, Güzelbahçe', 'İzmir, Karabağlar', 'İzmir, Karşıyaka',
  'İzmir, Kemalpaşa', 'İzmir, Konak', 'İzmir, Menderes', 'İzmir, Menemen', 'İzmir, Narlıdere',
  'İzmir, Ödemiş', 'İzmir, Seferihisar', 'İzmir, Selçuk', 'İzmir, Tire', 'İzmir, Torbalı', 'İzmir, Urla',
  // Kahramanmaraş
  'Kahramanmaraş', 'Kahramanmaraş, Dulkadiroğlu', 'Kahramanmaraş, Onikişubat',
  // Karabük
  'Karabük', 'Karabük, Merkez',
  // Karaman
  'Karaman', 'Karaman, Merkez',
  // Kars
  'Kars', 'Kars, Merkez',
  // Kastamonu
  'Kastamonu', 'Kastamonu, Merkez',
  // Kayseri
  'Kayseri', 'Kayseri, Melikgazi', 'Kayseri, Kocasinan', 'Kayseri, Talas', 'Kayseri, Develi',
  // Kilis
  'Kilis', 'Kilis, Merkez',
  // Kırıkkale
  'Kırıkkale', 'Kırıkkale, Merkez',
  // Kırklareli
  'Kırklareli', 'Kırklareli, Merkez', 'Kırklareli, Lüleburgaz',
  // Kırşehir
  'Kırşehir', 'Kırşehir, Merkez',
  // Kocaeli
  'Kocaeli', 'Kocaeli, İzmit', 'Kocaeli, Gebze', 'Kocaeli, Darıca', 'Kocaeli, Körfez',
  'Kocaeli, Gölcük', 'Kocaeli, Başiskele', 'Kocaeli, Çayırova', 'Kocaeli, Dilovası',
  // Konya
  'Konya', 'Konya, Selçuklu', 'Konya, Karatay', 'Konya, Meram', 'Konya, Ereğli', 'Konya, Akşehir',
  // Kütahya
  'Kütahya', 'Kütahya, Merkez', 'Kütahya, Tavşanlı',
  // Malatya
  'Malatya', 'Malatya, Battalgazi', 'Malatya, Yeşilyurt',
  // Manisa
  'Manisa', 'Manisa, Şehzadeler', 'Manisa, Yunusemre', 'Manisa, Akhisar', 'Manisa, Turgutlu', 'Manisa, Salihli',
  // Mardin
  'Mardin', 'Mardin, Artuklu', 'Mardin, Kızıltepe',
  // Mersin
  'Mersin', 'Mersin, Yenişehir', 'Mersin, Toroslar', 'Mersin, Akdeniz', 'Mersin, Mezitli', 'Mersin, Tarsus',
  // Muğla
  'Muğla', 'Muğla, Bodrum', 'Muğla, Fethiye', 'Muğla, Marmaris', 'Muğla, Milas', 'Muğla, Dalaman', 'Muğla, Menteşe', 'Muğla, Datça',
  // Muş
  'Muş', 'Muş, Merkez',
  // Nevşehir
  'Nevşehir', 'Nevşehir, Merkez', 'Nevşehir, Ürgüp', 'Nevşehir, Avanos',
  // Niğde
  'Niğde', 'Niğde, Merkez',
  // Ordu
  'Ordu', 'Ordu, Altınordu', 'Ordu, Ünye',
  // Osmaniye
  'Osmaniye', 'Osmaniye, Merkez',
  // Rize
  'Rize', 'Rize, Merkez',
  // Sakarya
  'Sakarya', 'Sakarya, Adapazarı', 'Sakarya, Serdivan', 'Sakarya, Arifiye',
  // Samsun
  'Samsun', 'Samsun, İlkadım', 'Samsun, Canik', 'Samsun, Atakum', 'Samsun, Tekkeköy',
  // Siirt
  'Siirt', 'Siirt, Merkez',
  // Sinop
  'Sinop', 'Sinop, Merkez',
  // Sivas
  'Sivas', 'Sivas, Merkez',
  // Şanlıurfa
  'Şanlıurfa', 'Şanlıurfa, Eyyübiye', 'Şanlıurfa, Haliliye', 'Şanlıurfa, Karaköprü',
  // Şırnak
  'Şırnak', 'Şırnak, Merkez', 'Şırnak, Cizre',
  // Tekirdağ
  'Tekirdağ', 'Tekirdağ, Süleymanpaşa', 'Tekirdağ, Çorlu', 'Tekirdağ, Çerkezköy', 'Tekirdağ, Ergene',
  // Tokat
  'Tokat', 'Tokat, Merkez',
  // Trabzon
  'Trabzon', 'Trabzon, Ortahisar', 'Trabzon, Akçaabat',
  // Tunceli
  'Tunceli', 'Tunceli, Merkez',
  // Uşak
  'Uşak', 'Uşak, Merkez',
  // Van
  'Van', 'Van, İpekyolu', 'Van, Tuşba', 'Van, Edremit',
  // Yalova
  'Yalova', 'Yalova, Merkez',
  // Yozgat
  'Yozgat', 'Yozgat, Merkez',
  // Zonguldak
  'Zonguldak', 'Zonguldak, Merkez', 'Zonguldak, Ereğli', 'Zonguldak, Kdz. Ereğlisi',
]

/** Klinik clinic_type → Branş eşleştirme */
export function branchMatches(clinicType: string | null, branch: string): boolean {
  if (!clinicType) return false
  const ct = clinicType.toLowerCase()
  const b = branch.toLowerCase()
  if (ct === b) return true
  // Anahtar kelime eşleştirme
  if (b.includes('plastik')) return ct.includes('plastik') || ct.includes('estetik cerrahi')
  if (b.includes('dermatoloji') || b.includes('cildiye')) return ct.includes('dermatoloji') || ct.includes('cildiye')
  if (b.includes('kbb') || b.includes('kulak')) return ct.includes('kbb') || ct.includes('kulak') || ct.includes('boğaz')
  if (b.includes('göz')) return ct.includes('göz')
  if (b.includes('medikal estetik')) return ct.includes('medikal estetik')
  if (b.includes('jinekoloji')) return ct.includes('jinekoloji') || ct.includes('genital')
  if (b.includes('üroloji')) return ct.includes('üroloji')
  if (b.includes('longevity') || b.includes('fonksiyonel')) return ct.includes('longevity') || ct.includes('fonksiyonel')
  if (b.includes('obezite')) return ct.includes('obezite') || ct.includes('metabolizma')
  if (b.includes('diş')) return ct.includes('diş') || ct.includes('ağız')
  return false
}

/** Konum filtresi eşleştirme (klinik.location) */
export function locationMatches(clinicLocation: string | null, filterLoc: string): boolean {
  if (!clinicLocation || !filterLoc) return false
  const cl = clinicLocation.toLowerCase().trim()
  const fl = filterLoc.toLowerCase().trim()
  if (cl === fl) return true
  // "İstanbul, Beylikdüzü" → hem il hem ilçe kontrolü
  const parts = fl.split(',').map(p => p.trim())
  return parts.every(p => p && cl.includes(p))
}
