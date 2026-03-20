<!-- Login - PS-CRM Delhi -->
<!DOCTYPE html>

<html class="light" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Login | PS-CRM Delhi</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&amp;family=Inter:wght@400;500;600&amp;family=JetBrains+Mono&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
          darkMode: "class",
          theme: {
            extend: {
              colors: {
                "inverse-on-surface": "#eaf1ff",
                "secondary-container": "#fea619",
                "outline": "#6e7980",
                "on-secondary-fixed": "#2a1700",
                "secondary": "#855300",
                "secondary-fixed": "#ffddb8",
                "on-primary": "#ffffff",
                "surface": "#f8f9ff",
                "surface-container-low": "#eff4ff",
                "tertiary-fixed": "#6bff8f",
                "on-tertiary-fixed": "#002109",
                "primary-container": "#38bdf8",
                "on-secondary-fixed-variant": "#653e00",
                "surface-dim": "#cbdbf5",
                "inverse-surface": "#213145",
                "error-container": "#ffdad6",
                "on-tertiary-container": "#004f20",
                "surface-tint": "#00668a",
                "on-surface": "#0b1c30",
                "background": "#f8f9ff",
                "on-error": "#ffffff",
                "on-tertiary-fixed-variant": "#005321",
                "tertiary-fixed-dim": "#4ae176",
                "secondary-fixed-dim": "#ffb95f",
                "on-primary-fixed-variant": "#004c69",
                "outline-variant": "#bdc8d1",
                "surface-bright": "#f8f9ff",
                "tertiary-container": "#2ccb63",
                "surface-container": "#e5eeff",
                "inverse-primary": "#7bd0ff",
                "on-primary-container": "#004965",
                "surface-variant": "#d3e4fe",
                "on-secondary-container": "#684000",
                "on-tertiary": "#ffffff",
                "on-error-container": "#93000a",
                "on-primary-fixed": "#001e2c",
                "tertiary": "#006e2f",
                "surface-container-high": "#dce9ff",
                "surface-container-lowest": "#ffffff",
                "primary-fixed-dim": "#7bd0ff",
                "surface-container-highest": "#d3e4fe",
                "primary-fixed": "#c4e7ff",
                "on-background": "#0b1c30",
                "error": "#ba1a1a",
                "on-secondary": "#ffffff",
                "on-surface-variant": "#3e484f",
                "primary": "#00668a"
              },
              fontFamily: {
                "headline": ["Plus Jakarta Sans"],
                "body": ["Inter"],
                "label": ["Inter"],
                "mono": ["JetBrains Mono"]
              },
              borderRadius: {"DEFAULT": "0.25rem", "lg": "0.5rem", "xl": "0.75rem", "full": "9999px"},
            },
          },
        }
      </script>
<style>
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
            vertical-align: middle;
        }
        .bg-delhi-pattern {
            background-color: #f0f9ff;
            background-image: url("data:image/svg+xml,%3Csvg width='400' height='400' viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3Base-path d='M0 400 L400 400 L400 350 L380 340 L350 360 L320 320 L280 350 L250 300 L200 340 L150 280 L100 320 L50 310 L0 350 Z' fill='none' stroke='%2338bdf8' stroke-width='1' opacity='0.3'/%3E%3C/svg%3E");
            background-repeat: no-repeat;
            background-position: bottom right;
        }
      </style>
</head>
<body class="bg-surface font-body text-on-surface selection:bg-primary-container selection:text-on-primary-container">
<!-- Login Shell Suppression: Navigation Hidden for Transactional Focus -->
<main class="min-h-screen flex flex-col md:flex-row">
<!-- LEFT COLUMN: AUTHENTICATION (55%) -->
<section class="w-full md:w-[55%] bg-surface-container-lowest flex flex-col p-8 md:p-16">
<!-- Brand Anchor -->
<div class="flex items-center gap-1.5 mb-24">
<span class="font-headline font-extrabold text-[20px] text-on-background tracking-tight">PS-CRM</span>
<div class="w-1.5 h-1.5 rounded-full bg-primary-container"></div>
</div>
<!-- Login Content Area -->
<div class="max-w-[400px] w-full mx-auto my-auto">
<header class="mb-10">
<h1 class="font-headline font-bold text-[32px] text-on-background leading-tight mb-3">Welcome back</h1>
<p class="text-[16px] text-on-surface-variant font-normal">Track your civic complaints across Delhi</p>
</header>
<form class="space-y-6">
<div class="space-y-2">
<label class="block text-[13px] font-semibold text-on-surface-variant uppercase tracking-wider" for="mobile">Mobile Number</label>
<div class="relative flex items-center group">
<div class="flex items-center justify-center bg-surface-container-low h-12 px-4 rounded-l-lg border-b border-outline-variant/30 text-on-surface font-medium text-[15px]">
                                +91
                            </div>
<input class="w-full h-12 bg-transparent border-0 border-b border-outline-variant/30 focus:ring-0 focus:border-primary transition-all duration-300 px-4 text-[16px] placeholder:text-outline/50" id="mobile" placeholder="98765 43210" type="tel"/>
</div>
</div>
<button class="w-full h-12 bg-primary-container hover:bg-primary transition-all duration-200 rounded-lg flex items-center justify-center gap-2 text-on-primary-container font-bold group" type="submit">
<span>Send OTP</span>
<span class="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
</button>
</form>
<div class="relative my-8">
<div class="absolute inset-0 flex items-center">
<span class="w-full border-t border-outline-variant/20"></span>
</div>
<div class="relative flex justify-center text-xs uppercase">
<span class="bg-surface-container-lowest px-4 text-outline font-medium tracking-widest">or</span>
</div>
</div>
<button class="w-full h-12 border border-outline-variant/30 hover:bg-surface-container-low transition-colors rounded-lg flex items-center justify-center gap-2 text-on-surface font-semibold group">
<span>Explore Public Dashboard</span>
<span class="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">trending_up</span>
</button>
<footer class="mt-24 flex items-center gap-2 text-[12px] text-outline/60 font-medium">
<span class="material-symbols-outlined text-[14px]">verified_user</span>
<span>Secured by Bhashini · Delhi Municipal Services</span>
</footer>
</div>
</section>
<!-- RIGHT COLUMN: VISUAL CONTEXT (45%) -->
<section class="hidden md:flex md:w-[45%] bg-[#f0f9ff] relative overflow-hidden flex-col items-center justify-center p-12 bg-delhi-pattern">
<!-- Abstract Line Art Illustration Content Area -->
<div class="relative z-10 w-full max-w-md flex flex-col items-center text-center">
<!-- Skyline Placeholder (Represented via styling but keeping img tag for consistency) -->
<div class="w-full aspect-video mb-12 flex items-end justify-center">
<img alt="Delhi cityscape line art in thin sky blue strokes" class="max-w-full h-auto opacity-60" data-alt="Minimalist line art illustration of Delhi monuments like India Gate" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAvzIUNMWz2YR55xQos5Zt_HiDACjhR4VeuXANsEapZOzQhNP9S0UoWU0TkNcJRUOCMg1dB5fKw2EG-3SRMFoag5hhuT9lnV6s_2D4M4qeoJRjoJJ8MOcQ8jcP9yEYRQ2MDjRySJPMdfpEczPf6d90h36aML21tzI8MIvO6MSAgOLkdk_T7q-q0dQYkyfMLdSKD3iOB3j1sbvj6JOzP3k8PKe7-E6OEQcesGFuWvgNARvA4CFwVoktUxgmad_YJG3W-zioKM7D9gtG4"/>
</div>
<div class="mb-12">
<h2 class="font-headline font-bold text-[28px] text-on-background mb-2">PS-CRM</h2>
<p class="text-[14px] text-primary font-medium tracking-wide">Smart Civic Intelligence for Delhi</p>
</div>
<!-- Bento Style Stats Grid -->
<div class="grid grid-cols-1 gap-4 w-full">
<div class="flex items-center justify-between p-5 bg-surface-container-lowest rounded-xl shadow-[0_10px_30px_rgba(0,102,138,0.04)] border border-white/50 backdrop-blur-sm">
<div class="flex items-center gap-4">
<div class="w-10 h-10 rounded-full bg-tertiary-container/10 flex items-center justify-center">
<span class="material-symbols-outlined text-tertiary" data-weight="fill">check_circle</span>
</div>
<span class="text-[14px] font-semibold text-on-surface">Resolved Cases</span>
</div>
<span class="font-mono text-lg font-bold text-tertiary">12,400+</span>
</div>
<div class="flex items-center justify-between p-5 bg-surface-container-lowest rounded-xl shadow-[0_10px_30px_rgba(0,102,138,0.04)] border border-white/50 backdrop-blur-sm">
<div class="flex items-center gap-4">
<div class="w-10 h-10 rounded-full bg-secondary-container/10 flex items-center justify-center">
<span class="material-symbols-outlined text-secondary" data-weight="fill">speed</span>
</div>
<span class="text-[14px] font-semibold text-on-surface">Average SLA</span>
</div>
<span class="font-mono text-lg font-bold text-secondary">41-Day</span>
</div>
<div class="flex items-center justify-between p-5 bg-surface-container-lowest rounded-xl shadow-[0_10px_30px_rgba(0,102,138,0.04)] border border-white/50 backdrop-blur-sm">
<div class="flex items-center gap-4">
<div class="w-10 h-10 rounded-full bg-primary-container/10 flex items-center justify-center">
<span class="material-symbols-outlined text-primary" data-weight="fill">account_balance</span>
</div>
<span class="text-[14px] font-semibold text-on-surface">Integrated Depts.</span>
</div>
<span class="font-mono text-lg font-bold text-primary">6</span>
</div>
</div>
</div>
<!-- Atmospheric Depth Elements -->
<div class="absolute top-[-10%] right-[-10%] w-64 h-64 bg-primary-container/10 rounded-full blur-[100px]"></div>
<div class="absolute bottom-[-5%] left-[-5%] w-80 h-80 bg-secondary-container/5 rounded-full blur-[120px]"></div>
</section>
</main>
</body></html>

<!-- Citizen Dashboard - PS-CRM Delhi -->
<!DOCTYPE html>

<html lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Citizen Dashboard - PS-CRM Delhi</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&amp;family=Inter:wght@400;500;600&amp;family=JetBrains+Mono&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<style>
        body { font-family: 'Inter', sans-serif; }
        .font-headline { font-family: 'Plus Jakarta Sans', sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
    </style>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    colors: {
                        "inverse-on-surface": "#eaf1ff",
                        "secondary-container": "#fea619",
                        "outline": "#6e7980",
                        "on-secondary-fixed": "#2a1700",
                        "secondary": "#855300",
                        "secondary-fixed": "#ffddb8",
                        "on-primary": "#ffffff",
                        "surface": "#f8f9ff",
                        "surface-container-low": "#eff4ff",
                        "tertiary-fixed": "#6bff8f",
                        "on-tertiary-fixed": "#002109",
                        "primary-container": "#38bdf8",
                        "on-secondary-fixed-variant": "#653e00",
                        "surface-dim": "#cbdbf5",
                        "inverse-surface": "#213145",
                        "error-container": "#ffdad6",
                        "on-tertiary-container": "#004f20",
                        "surface-tint": "#00668a",
                        "on-surface": "#0b1c30",
                        "background": "#f8f9ff",
                        "on-error": "#ffffff",
                        "on-tertiary-fixed-variant": "#005321",
                        "tertiary-fixed-dim": "#4ae176",
                        "secondary-fixed-dim": "#ffb95f",
                        "on-primary-fixed-variant": "#004c69",
                        "outline-variant": "#bdc8d1",
                        "surface-bright": "#f8f9ff",
                        "tertiary-container": "#2ccb63",
                        "surface-container": "#e5eeff",
                        "inverse-primary": "#7bd0ff",
                        "on-primary-container": "#004965",
                        "surface-variant": "#d3e4fe",
                        "on-secondary-container": "#684000",
                        "on-tertiary": "#ffffff",
                        "on-error-container": "#93000a",
                        "on-primary-fixed": "#001e2c",
                        "tertiary": "#006e2f",
                        "surface-container-high": "#dce9ff",
                        "surface-container-lowest": "#ffffff",
                        "primary-fixed-dim": "#7bd0ff",
                        "surface-container-highest": "#d3e4fe",
                        "primary-fixed": "#c4e7ff",
                        "on-background": "#0b1c30",
                        "error": "#ba1a1a",
                        "on-secondary": "#ffffff",
                        "on-surface-variant": "#3e484f",
                        "primary": "#00668a"
                    },
                    fontFamily: {
                        "headline": ["Plus Jakarta Sans"],
                        "body": ["Inter"],
                        "label": ["Inter"]
                    },
                    borderRadius: {"DEFAULT": "0.25rem", "lg": "0.5rem", "xl": "0.75rem", "full": "9999px"},
                },
            },
        }
    </script>
</head>
<body class="bg-surface text-on-surface">
<!-- Sidebar Navigation -->
<aside class="flex flex-col fixed left-0 top-0 h-full overflow-y-auto w-[240px] bg-white border-r border-outline-variant/30 z-50">
<div class="p-6">
<h1 class="text-xl font-bold text-slate-900 font-headline tracking-tight">PS-CRM Delhi</h1>
<p class="text-xs text-on-surface-variant mt-1">Public Service CRM</p>
</div>
<div class="px-4 mb-6">
<div class="flex items-center gap-3 p-3 bg-surface-container-low rounded-xl">
<div class="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold overflow-hidden">
<img alt="RK" class="w-full h-full object-cover" data-alt="Portrait of a young Indian man smiling" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDhz5zDZh4oqksVnC9h4pNl8wOsOIkn1E_93E5Jpv366hEc7pDwMXeXz7BGpmbW9Ek-t7F_VMEjt7X3LAXY1RA4xOi_c1ZABAag-I6NgqnWimv4KXsVuJDpokj6zdUUWvP0DOjcf_m5gnLPCj0b2gA7KLa594RqTKs5mtFB67quKn2G_rkwoAr_8FNzrwDFQP5PRda1eKGvD9tZDrEpxGTaguaJl5VN0qHWhRdaTljbj1zcEG8WVLrldtDiiMKTDqYbjFxX7ZAmZnqX"/>
</div>
<div class="overflow-hidden">
<p class="text-sm font-bold truncate">Rahul Kumar</p>
<span class="text-[10px] px-2 py-0.5 bg-primary/10 text-primary font-bold rounded-full">Citizen</span>
</div>
</div>
</div>
<nav class="flex-1 px-3 space-y-1">
<a class="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-sky-50 text-sky-600 border-r-4 border-sky-500 transition-colors font-medium text-sm" href="#">
<span class="material-symbols-outlined" data-icon="dashboard">dashboard</span>
<span>Dashboard</span>
</a>
<a class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low transition-colors font-medium text-sm" href="#">
<span class="material-symbols-outlined" data-icon="assignment">assignment</span>
<span>My Complaints</span>
</a>
<a class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low transition-colors font-medium text-sm" href="#">
<span class="material-symbols-outlined" data-icon="add_circle">add_circle</span>
<span>Report Issue</span>
</a>
<a class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low transition-colors font-medium text-sm relative" href="#">
<span class="material-symbols-outlined" data-icon="notifications">notifications</span>
<span>Notifications</span>
<span class="absolute right-3 w-2 h-2 bg-error rounded-full"></span>
</a>
<div class="pt-4 mt-4 border-t border-outline-variant/10">
<a class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low transition-colors font-medium text-sm" href="#">
<span class="material-symbols-outlined" data-icon="help">help</span>
<span>Help</span>
</a>
<a class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low transition-colors font-medium text-sm" href="#">
<span class="material-symbols-outlined" data-icon="settings">settings</span>
<span>Settings</span>
</a>
<a class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-error hover:bg-error-container/20 transition-colors font-medium text-sm mt-4" href="#">
<span class="material-symbols-outlined" data-icon="logout">logout</span>
<span>Logout</span>
</a>
</div>
</nav>
</aside>
<!-- Main Content Area -->
<main class="ml-[240px] min-h-screen">
<!-- Top Bar -->
<header class="flex items-center justify-between px-8 h-[60px] sticky top-0 z-40 bg-white/80 backdrop-blur-md shadow-sm">
<h2 class="text-xl font-bold font-headline text-on-surface">Dashboard</h2>
<div class="flex items-center gap-6">
<div class="relative hidden md:block">
<span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm" data-icon="search">search</span>
<input class="pl-10 pr-4 py-1.5 w-[320px] bg-surface-container-low border-none rounded-full text-sm focus:ring-2 focus:ring-primary/20 transition-all" placeholder="Search ticket ID or area..." type="text"/>
</div>
<div class="flex items-center gap-4">
<button class="relative p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors">
<span class="material-symbols-outlined" data-icon="notifications">notifications</span>
<span class="absolute top-1 right-1 w-4 h-4 bg-error text-[10px] text-white flex items-center justify-center rounded-full font-bold">3</span>
</button>
<div class="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden border border-outline-variant/20">
<img alt="RK" class="w-full h-full object-cover" data-alt="Small profile avatar of a citizen" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCqAkdNxQvFEjGK5YujaX4oCqvlpCVFEVWj4KxqGfdyoz2CMG6ExsqAOhC-hHLwp99xFsPnz3drDmC3almJiQLBElwgacKVe-jQFAPYKhrRa74c_2TBc177oCq_igOkONgjN_6uvVuTstIBZgGlUxxNV2LkC1Esq2UPN2pqWnmZM3dWmp3sNG_LVc1PcW3U6zuu19HXlTJerMelDJ5x4frAcmFRj5OioaaMgkao7lrKtNsXPiQDHO0K-Jh_86HDi8yltGLZ3fpWNogx"/>
</div>
</div>
</div>
</header>
<!-- Dashboard Content Grid -->
<div class="p-8 grid grid-cols-1 lg:grid-cols-[62%_38%] gap-8 max-w-[1600px] mx-auto">
<!-- LEFT COLUMN -->
<div class="space-y-8">
<!-- Map Card -->
<section class="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm border border-outline-variant/5">
<div class="p-5 flex items-center justify-between border-b border-surface-container-low">
<div class="flex items-center gap-3">
<h3 class="font-headline font-bold text-on-surface">Delhi Complaint Map</h3>
<span class="flex items-center gap-1.5 px-2 py-0.5 bg-tertiary-container/20 text-tertiary text-[10px] font-bold uppercase tracking-wider rounded-full">
<span class="w-1.5 h-1.5 bg-tertiary-container rounded-full animate-pulse"></span>
                                Live
                            </span>
</div>
<div class="flex gap-2">
<button class="w-8 h-8 bg-surface-container-low rounded-lg flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors">
<span class="material-symbols-outlined text-sm" data-icon="add">add</span>
</button>
<button class="w-8 h-8 bg-surface-container-low rounded-lg flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors">
<span class="material-symbols-outlined text-sm" data-icon="remove">remove</span>
</button>
</div>
</div>
<div class="relative h-[380px] bg-slate-100 overflow-hidden">
<img class="w-full h-full object-cover opacity-60 grayscale" data-alt="Stylized map of Delhi city streets" data-location="Delhi" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCXoMQtpLnlyEO-i4kHAYKe8zFHrHxqxrCiHhmsIgZbOg5L09YgIg0GW_6pZaLyRbRC1QdhpnkvK3rIMGJxjRMTHdjni1zustYQEUbAEHssTEUHezNzMcZJ_gnXEt6zZeeTzSYuyR4Q0M8mbmScLWwwGbH3U6Mc0X_V0vsbzuAGZqrFzefflhqt5Z3_Ec0RkhO6LcUwyzXg76UX-GvTsv3byISZggtstGC50OwWyMfsY7rdPAp5zN7ZOQfdBnTi0SRClGFOmJXjTnSg"/>
<!-- Map Markers Overlay -->
<div class="absolute inset-0 pointer-events-none">
<!-- Heatmap Clusters -->
<div class="absolute top-1/4 left-1/3 w-12 h-12 bg-error/30 rounded-full flex items-center justify-center text-[10px] font-bold text-error border border-error/50">12</div>
<div class="absolute top-1/2 left-1/2 w-10 h-10 bg-secondary-container/30 rounded-full flex items-center justify-center text-[10px] font-bold text-secondary border border-secondary/50">8</div>
<div class="absolute bottom-1/3 right-1/4 w-8 h-8 bg-primary/30 rounded-full flex items-center justify-center text-[10px] font-bold text-primary border border-primary/50">7</div>
<div class="absolute top-1/2 right-1/3 w-6 h-6 bg-tertiary-container/30 rounded-full flex items-center justify-center text-[10px] font-bold text-tertiary border border-tertiary/50">3</div>
<!-- User's Active Pin -->
<div class="absolute top-[45%] left-[22%] -translate-x-1/2 -translate-y-1/2">
<div class="relative flex items-center justify-center">
<span class="absolute w-8 h-8 bg-primary/20 rounded-full animate-ping"></span>
<span class="material-symbols-outlined text-primary text-3xl drop-shadow-md" data-icon="location_on" style="font-variation-settings: 'FILL' 1;">location_on</span>
</div>
<div class="mt-1 bg-white px-2 py-1 rounded shadow-lg text-[10px] font-bold border border-primary/20">Rohini Sector 7</div>
</div>
</div>
<!-- Map Legend Overlay -->
<div class="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg flex flex-wrap justify-between items-center gap-4 text-xs font-medium border border-outline-variant/20">
<div class="flex gap-4">
<span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-error"></span> Critical (12)</span>
<span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-secondary-container"></span> Pending (8)</span>
<span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-primary"></span> Ongoing (7)</span>
<span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-tertiary-container"></span> Resolved (3)</span>
</div>
<span class="text-on-surface-variant italic">Data updated 2m ago</span>
</div>
</div>
</section>
<!-- My Complaints -->
<section>
<div class="flex items-center justify-between mb-4">
<div class="flex items-center gap-3">
<h3 class="font-headline font-bold text-on-surface">My Complaints</h3>
<span class="px-2 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded-full">3 Active</span>
</div>
<button class="text-xs font-bold text-primary hover:underline">View All History</button>
</div>
<div class="space-y-4">
<!-- Card 1 -->
<div class="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/10 hover:shadow-md transition-shadow">
<div class="flex justify-between items-start mb-4">
<div>
<div class="flex items-center gap-2 mb-1">
<span class="text-[10px] font-mono text-on-surface-variant">#GR-2024-04821</span>
<span class="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded uppercase">In Progress</span>
</div>
<h4 class="font-bold text-on-surface">Drainage Blockage</h4>
<p class="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
<span class="material-symbols-outlined text-xs" data-icon="location_on">location_on</span>
                                        Rohini Sector 7, Delhi-110085
                                    </p>
</div>
<button class="p-2 hover:bg-surface-container-low rounded-full">
<span class="material-symbols-outlined text-on-surface-variant" data-icon="more_vert">more_vert</span>
</button>
</div>
<div class="relative pt-2">
<div class="flex justify-between text-[10px] text-on-surface-variant mb-2 font-medium">
<span>Submitted</span>
<span>Inspected</span>
<span class="text-primary font-bold">In Repair</span>
<span>Verified</span>
</div>
<div class="h-1.5 w-full bg-surface-container-low rounded-full overflow-hidden flex">
<div class="h-full bg-primary w-1/4 border-r border-white"></div>
<div class="h-full bg-primary w-1/4 border-r border-white"></div>
<div class="h-full bg-primary w-1/4 border-r border-white"></div>
<div class="h-full bg-surface-container-low w-1/4"></div>
</div>
</div>
</div>
<!-- Card 2 -->
<div class="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/10 opacity-80">
<div class="flex justify-between items-start mb-4">
<div>
<div class="flex items-center gap-2 mb-1">
<span class="text-[10px] font-mono text-on-surface-variant">#GR-2024-03102</span>
<span class="px-2 py-0.5 bg-tertiary-container/20 text-tertiary text-[10px] font-bold rounded uppercase">Resolved</span>
</div>
<h4 class="font-bold text-on-surface">Pothole Repair</h4>
<p class="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
<span class="material-symbols-outlined text-xs" data-icon="location_on">location_on</span>
                                        Sector 12, Dwarka
                                    </p>
</div>
</div>
<div class="relative pt-2">
<div class="h-1.5 w-full bg-tertiary-container rounded-full overflow-hidden"></div>
<p class="text-[10px] text-tertiary font-bold mt-2 flex items-center gap-1">
<span class="material-symbols-outlined text-[14px]" data-icon="check_circle" style="font-variation-settings: 'FILL' 1;">check_circle</span>
                                    Issue resolved on March 12, 2024
                                </p>
</div>
</div>
<!-- Card 3 -->
<div class="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/10">
<div class="flex justify-between items-start mb-4">
<div>
<div class="flex items-center gap-2 mb-1">
<span class="text-[10px] font-mono text-on-surface-variant">#GR-2024-05119</span>
<span class="px-2 py-0.5 bg-surface-container-high text-on-surface-variant text-[10px] font-bold rounded uppercase">Submitted</span>
</div>
<h4 class="font-bold text-on-surface">Broken Streetlight</h4>
<p class="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
<span class="material-symbols-outlined text-xs" data-icon="location_on">location_on</span>
                                        Main Market, Karol Bagh
                                    </p>
</div>
</div>
<div class="h-1.5 w-full bg-surface-container-low rounded-full overflow-hidden flex">
<div class="h-full bg-slate-400 w-1/4 border-r border-white"></div>
<div class="h-full bg-surface-container-low w-3/4"></div>
</div>
</div>
</div>
</section>
</div>
<!-- RIGHT COLUMN -->
<div class="space-y-8">
<!-- Area Activity Card -->
<section class="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/5 shadow-sm">
<h3 class="font-headline font-bold text-on-surface mb-4">Rohini Ward Activity</h3>
<div class="rounded-lg h-32 mb-4 overflow-hidden border border-outline-variant/10">
<img class="w-full h-full object-cover" data-alt="Micro satellite map view of an urban residential ward" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBv_oTkx4_JwkqZuQmzkCVj14nzXgzljdjA2xp3CNuTXynI03LJUHKbiw3ugPzxfIhzJCeix1K2MLp-FbTFTbg6bMYTX2MXYfrGvtWSn3XK_TLAJKWwuQa4LVWZdT_nHOZrF4KR3navszlPd1kAJxRa7bhBQhWRtHnnwZ3pfuivLS1391jI0piP9yaV3BM7mrpPCCOylX2HJomidcWYEwr1mBl0nn6tbpGjjsdXslrhh_UlPcrNvrqTWpOT0z12shtz-jCShDyz7jTC"/>
</div>
<div class="space-y-3">
<div class="flex items-center justify-between">
<div class="flex items-center gap-2 text-xs font-medium text-on-surface-variant">
<span class="w-2 h-2 rounded-full bg-primary"></span> Drainage
                            </div>
<span class="text-xs font-bold">12 Reports</span>
</div>
<div class="flex items-center justify-between">
<div class="flex items-center gap-2 text-xs font-medium text-on-surface-variant">
<span class="w-2 h-2 rounded-full bg-secondary-container"></span> Road Repair
                            </div>
<span class="text-xs font-bold">4 Reports</span>
</div>
<div class="flex items-center justify-between">
<div class="flex items-center gap-2 text-xs font-medium text-on-surface-variant">
<span class="w-2 h-2 rounded-full bg-outline"></span> Streetlights
                            </div>
<span class="text-xs font-bold">2 Reports</span>
</div>
</div>
</section>
<!-- SLA Tracker Card -->
<section class="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/5 shadow-sm text-center">
<h3 class="font-headline font-bold text-on-surface mb-6 text-left">Active SLA Tracker</h3>
<div class="relative w-32 h-32 mx-auto mb-4">
<svg class="w-full h-full transform -rotate-90">
<circle class="text-surface-container-low" cx="64" cy="64" fill="transparent" r="58" stroke="currentColor" stroke-width="8"></circle>
<circle class="text-primary" cx="64" cy="64" fill="transparent" r="58" stroke="currentColor" stroke-dasharray="364.4" stroke-dashoffset="160.3" stroke-width="8"></circle>
</svg>
<div class="absolute inset-0 flex flex-col items-center justify-center">
<span class="text-lg font-bold">23</span>
<span class="text-[10px] text-on-surface-variant font-medium">of 41 days</span>
</div>
</div>
<div class="mb-4">
<span class="px-3 py-1 bg-tertiary-container/20 text-tertiary text-xs font-bold rounded-full">On Track</span>
</div>
<p class="text-xs text-on-surface-variant">Target Resolution Deadline:<br/><strong class="text-on-surface">April 24, 2024</strong></p>
</section>
<!-- Nearby Alerts -->
<section class="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/5 shadow-sm">
<h3 class="font-headline font-bold text-on-surface mb-4">Nearby Alerts</h3>
<div class="space-y-4">
<div class="flex gap-3">
<div class="mt-1 w-2 h-2 rounded-full bg-error shrink-0"></div>
<div>
<p class="text-xs font-bold leading-tight">Water Supply Interruption</p>
<p class="text-[10px] text-on-surface-variant">MCD Maintenance in Rohini Sector 7-8</p>
</div>
</div>
<div class="flex gap-3">
<div class="mt-1 w-2 h-2 rounded-full bg-secondary-container shrink-0"></div>
<div>
<p class="text-xs font-bold leading-tight">Road Diversion: Sector 11</p>
<p class="text-[10px] text-on-surface-variant">Effective tomorrow morning 8 AM</p>
</div>
</div>
<a class="inline-block text-xs font-bold text-primary hover:underline mt-2" href="#">View all alerts →</a>
</div>
</section>
<!-- Quick Actions -->
<section class="space-y-3">
<button class="w-full flex items-center justify-center gap-2 bg-primary text-on-primary py-3.5 rounded-lg font-bold text-sm shadow-lg shadow-primary/20 hover:bg-primary-container hover:text-on-primary-container transition-all active:scale-[0.98]">
<span class="material-symbols-outlined text-lg" data-icon="add">add</span>
                        Report New Issue
                    </button>
<button class="w-full flex items-center justify-center gap-2 bg-white text-on-surface border border-outline-variant/20 py-3 rounded-lg font-bold text-sm hover:bg-surface-container-low transition-colors">
<span class="material-symbols-outlined text-lg" data-icon="call">call</span>
                        Call Centre (1031)
                    </button>
</section>
</div>
</div>
</main>
</body></html>

<!-- OTP Verification - PS-CRM Delhi -->
<!DOCTYPE html>

<html lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>OTP Verification | PS-CRM Delhi</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&amp;family=Inter:wght@400;500;600&amp;family=JetBrains+Mono:wght@400;500&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            colors: {
              "inverse-on-surface": "#eaf1ff",
              "secondary-container": "#fea619",
              "outline": "#6e7980",
              "on-secondary-fixed": "#2a1700",
              "secondary": "#855300",
              "secondary-fixed": "#ffddb8",
              "on-primary": "#ffffff",
              "surface": "#f8f9ff",
              "surface-container-low": "#eff4ff",
              "tertiary-fixed": "#6bff8f",
              "on-tertiary-fixed": "#002109",
              "primary-container": "#38bdf8",
              "on-secondary-fixed-variant": "#653e00",
              "surface-dim": "#cbdbf5",
              "inverse-surface": "#213145",
              "error-container": "#ffdad6",
              "on-tertiary-container": "#004f20",
              "surface-tint": "#00668a",
              "on-surface": "#0b1c30",
              "background": "#f8f9ff",
              "on-error": "#ffffff",
              "on-tertiary-fixed-variant": "#005321",
              "tertiary-fixed-dim": "#4ae176",
              "secondary-fixed-dim": "#ffb95f",
              "on-primary-fixed-variant": "#004c69",
              "outline-variant": "#bdc8d1",
              "surface-bright": "#f8f9ff",
              "tertiary-container": "#2ccb63",
              "surface-container": "#e5eeff",
              "inverse-primary": "#7bd0ff",
              "on-primary-container": "#004965",
              "surface-variant": "#d3e4fe",
              "on-secondary-container": "#684000",
              "on-tertiary": "#ffffff",
              "on-error-container": "#93000a",
              "on-primary-fixed": "#001e2c",
              "tertiary": "#006e2f",
              "surface-container-high": "#dce9ff",
              "surface-container-lowest": "#ffffff",
              "primary-fixed-dim": "#7bd0ff",
              "surface-container-highest": "#d3e4fe",
              "primary-fixed": "#c4e7ff",
              "on-background": "#0b1c30",
              "error": "#ba1a1a",
              "on-secondary": "#ffffff",
              "on-surface-variant": "#3e484f",
              "primary": "#00668a"
            },
            fontFamily: {
              "headline": ["Plus Jakarta Sans"],
              "body": ["Inter"],
              "label": ["Inter"],
              "mono": ["JetBrains Mono"]
            },
            borderRadius: {"DEFAULT": "0.25rem", "lg": "0.5rem", "xl": "0.75rem", "full": "9999px"},
          },
        },
      }
    </script>
<style>
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        body { font-family: 'Inter', sans-serif; }
        h1, h2, .font-headline { font-family: 'Plus Jakarta Sans', sans-serif; }
        .otp-input:focus {
            border-color: #38bdf8;
            box-shadow: 0 0 0 4px rgba(56, 189, 248, 0.15);
            outline: none;
        }
        /* No-Line Rule Implementation */
        .glass-panel {
            background: rgba(255, 255, 255, 0.8);
            backdrop-filter: blur(12px);
        }
    </style>
</head>
<body class="bg-background text-on-background min-h-screen flex">
<!-- Suppression Logic: SideNav and TopAppBar are suppressed for Transactional OTP Flow -->
<!-- Left Content Column -->
<main class="w-full lg:w-1/2 flex flex-col justify-center items-center px-6 lg:px-12 py-12 relative overflow-hidden bg-surface-container-lowest">
<!-- Back Arrow (Top-Left Alignment Relative to Form) -->
<div class="absolute top-8 left-8 lg:left-12">
<button class="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors group">
<span class="material-symbols-outlined text-[20px] transition-transform group-hover:-translate-x-1">arrow_back</span>
<span class="text-sm font-medium font-label">Back to login</span>
</button>
</div>
<!-- Form Container -->
<div class="w-full max-w-[400px]">
<!-- Header Section -->
<div class="mb-10">
<div class="w-12 h-12 bg-primary-container/20 rounded-xl flex items-center justify-center mb-6">
<span class="material-symbols-outlined text-primary text-[28px]" data-weight="fill" style="font-variation-settings: 'FILL' 1;">shield_person</span>
</div>
<h1 class="text-[28px] font-bold tracking-tight text-on-surface mb-3 leading-tight font-headline">
                    Verify your number
                </h1>
<p class="text-on-surface-variant text-sm leading-relaxed">
                    We sent a 6-digit OTP to <span class="text-[#0f172a] font-medium">+91 98765 43210</span>. Valid for 5 minutes.
                </p>
</div>
<!-- OTP Input Section -->
<form action="#" class="space-y-8">
<div>
<label class="block text-[13px] font-medium text-on-surface-variant mb-4 font-label">Enter OTP</label>
<div class="flex gap-[10px] justify-between">
<!-- Individual Input Boxes: 56x64px -->
<input autofocus="" class="otp-input w-[56px] h-[64px] border-[1.5px] border-outline-variant rounded-lg text-center text-xl font-bold font-mono bg-surface-container-lowest text-on-surface transition-all border-[#38bdf8] ring-4 ring-[#38bdf8]/15" maxlength="1" type="text" value="7"/>
<input class="otp-input w-[56px] h-[64px] border-[1.5px] border-outline-variant rounded-lg text-center text-xl font-bold font-mono bg-surface-container-lowest text-on-surface transition-all" maxlength="1" placeholder="·" type="text"/>
<input class="otp-input w-[56px] h-[64px] border-[1.5px] border-outline-variant rounded-lg text-center text-xl font-bold font-mono bg-surface-container-lowest text-on-surface transition-all" maxlength="1" placeholder="·" type="text"/>
<input class="otp-input w-[56px] h-[64px] border-[1.5px] border-outline-variant rounded-lg text-center text-xl font-bold font-mono bg-surface-container-lowest text-on-surface transition-all" maxlength="1" placeholder="·" type="text"/>
<input class="otp-input w-[56px] h-[64px] border-[1.5px] border-outline-variant rounded-lg text-center text-xl font-bold font-mono bg-surface-container-lowest text-on-surface transition-all" maxlength="1" placeholder="·" type="text"/>
<input class="otp-input w-[56px] h-[64px] border-[1.5px] border-outline-variant rounded-lg text-center text-xl font-bold font-mono bg-surface-container-lowest text-on-surface transition-all" maxlength="1" placeholder="·" type="text"/>
</div>
</div>
<!-- Resend & Countdown Section -->
<div class="flex items-center justify-between">
<button class="text-primary-container font-semibold text-sm hover:underline decoration-2 underline-offset-4" type="button">
                        Didn't receive it? Resend OTP
                    </button>
<div class="flex items-center gap-2 px-3 py-1.5 bg-surface-container-low rounded-full">
<span class="material-symbols-outlined text-[16px] text-on-surface-variant">schedule</span>
<span class="text-xs font-mono font-medium text-on-surface">0:42</span>
</div>
</div>
<!-- Primary Action -->
<button class="w-full bg-primary hover:bg-primary-container text-on-primary font-bold py-4 rounded-lg flex items-center justify-center gap-2 transition-all group shadow-sm active:scale-[0.98]" type="submit">
                    Verify &amp; Continue
                    <span class="material-symbols-outlined text-[20px] transition-transform group-hover:translate-x-1">arrow_forward</span>
</button>
<!-- Footnote -->
<p class="text-center text-on-surface-variant text-sm">
                    Wrong number? <a class="text-primary font-medium hover:underline" href="#">Go back and re-enter</a>
</p>
</form>
</div>
<!-- Delhi Civic Branding (Subtle) -->
<div class="absolute bottom-8 text-center">
<p class="text-[10px] tracking-[0.2em] uppercase font-bold text-on-surface-variant/30">
                Department of Public Services • Govt of NCT of Delhi
            </p>
</div>
</main>
<!-- Right Decorative Panel (Desktop Only) -->
<aside class="hidden lg:flex w-1/2 bg-surface-container-low relative flex-col items-center justify-center p-12 overflow-hidden">
<!-- Abstract Atmospheric Background -->
<div class="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10"></div>
<div class="absolute -top-24 -right-24 w-96 h-96 bg-primary-container/10 rounded-full blur-[100px]"></div>
<div class="absolute -bottom-24 -left-24 w-96 h-96 bg-tertiary-container/10 rounded-full blur-[100px]"></div>
<!-- Decorative Card (Bento Style) -->
<div class="relative z-10 w-full max-w-lg">
<div class="bg-surface-container-lowest rounded-[2rem] p-10 shadow-xl shadow-on-background/5 border border-white/40">
<div class="flex items-center gap-4 mb-8">
<div class="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center text-on-primary">
<span class="material-symbols-outlined text-[32px]">verified_user</span>
</div>
<div>
<div class="text-[20px] font-bold font-headline text-on-surface">Secure Access</div>
<div class="text-on-surface-variant text-sm">Your data is protected by Aadhaar encryption</div>
</div>
</div>
<!-- Illustrative Element (Abstract map/data visualization) -->
<div class="aspect-video w-full rounded-2xl bg-surface-container overflow-hidden mb-8 relative">
<img alt="Abstract digital network map of Delhi city infrastructure" class="w-full h-full object-cover opacity-60 mix-blend-multiply" data-alt="Abstract digital network map of Delhi city infrastructure" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDl9WrsKOHls1iCLEYspD_Y_pkwk9YevAJML_BxAA9JU9kHX91rzkGRrcNY-xQIcsFenVCWJQBZlgaQjf5nvxTP-WNTYlbJmqx8Tju8pkJLyPI2Gz7M11DhI_rsRrqFa8GyO-v39CeTaq-xs6PEo1TOkrtkERi0yEJrKauSIcxGkxBNVvm9IlA8oJZm8AnBniqlwWhR7PrRhohgi0wKxzIjH1llEDZuvFX-QPlvFCrSBJSVXCAckIG-h60wlIbY5pWJn8OjQ2se3S5A"/>
<div class="absolute inset-0 bg-gradient-to-t from-surface-container via-transparent to-transparent"></div>
<!-- Floating Indicator -->
<div class="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md p-3 rounded-xl flex items-center gap-3 shadow-lg">
<div class="w-2 h-2 rounded-full bg-tertiary animate-pulse"></div>
<span class="text-[11px] font-mono text-on-surface-variant">NODE_DELHI_CENTRAL: AUTHENTICATING...</span>
</div>
</div>
<blockquote class="border-l-4 border-primary-container pl-6">
<p class="text-on-surface-variant italic leading-relaxed mb-4">
                        "The fastest way to resolve public grievances in the heart of India. Secure, transparent, and built for every citizen."
                    </p>
<cite class="not-italic block">
<span class="font-bold text-on-surface text-sm">PS-CRM Intelligence</span><br/>
<span class="text-xs text-on-surface-variant">Smart Governance Initiative</span>
</cite>
</blockquote>
</div>
<!-- Floating Micro-Cards -->
<div class="absolute -right-6 -bottom-6 w-48 bg-white p-4 rounded-2xl shadow-2xl border border-white/50 flex items-center gap-3">
<div class="bg-tertiary-container/20 p-2 rounded-lg">
<span class="material-symbols-outlined text-tertiary" data-weight="fill" style="font-variation-settings: 'FILL' 1;">check_circle</span>
</div>
<div>
<div class="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">Status</div>
<div class="text-xs font-bold text-on-surface">Identity Verified</div>
</div>
</div>
</div>
</aside>
</body></html>

<!-- Complaint Detail - PS-CRM Delhi -->
<!DOCTYPE html>

<html class="light" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Complaint Detail | PS-CRM Delhi</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&amp;family=Inter:wght@400;500;600&amp;family=JetBrains+Mono&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            colors: {
              "inverse-on-surface": "#eaf1ff",
              "secondary-container": "#fea619",
              "outline": "#6e7980",
              "on-secondary-fixed": "#2a1700",
              "secondary": "#855300",
              "secondary-fixed": "#ffddb8",
              "on-primary": "#ffffff",
              "surface": "#f8f9ff",
              "surface-container-low": "#eff4ff",
              "tertiary-fixed": "#6bff8f",
              "on-tertiary-fixed": "#002109",
              "primary-container": "#38bdf8",
              "on-secondary-fixed-variant": "#653e00",
              "surface-dim": "#cbdbf5",
              "inverse-surface": "#213145",
              "error-container": "#ffdad6",
              "on-tertiary-container": "#004f20",
              "surface-tint": "#00668a",
              "on-surface": "#0b1c30",
              "background": "#f8f9ff",
              "on-error": "#ffffff",
              "on-tertiary-fixed-variant": "#005321",
              "tertiary-fixed-dim": "#4ae176",
              "secondary-fixed-dim": "#ffb95f",
              "on-primary-fixed-variant": "#004c69",
              "outline-variant": "#bdc8d1",
              "surface-bright": "#f8f9ff",
              "tertiary-container": "#2ccb63",
              "surface-container": "#e5eeff",
              "inverse-primary": "#7bd0ff",
              "on-primary-container": "#004965",
              "surface-variant": "#d3e4fe",
              "on-secondary-container": "#684000",
              "on-tertiary": "#ffffff",
              "on-error-container": "#93000a",
              "on-primary-fixed": "#001e2c",
              "tertiary": "#006e2f",
              "surface-container-high": "#dce9ff",
              "surface-container-lowest": "#ffffff",
              "primary-fixed-dim": "#7bd0ff",
              "surface-container-highest": "#d3e4fe",
              "primary-fixed": "#c4e7ff",
              "on-background": "#0b1c30",
              "error": "#ba1a1a",
              "on-secondary": "#ffffff",
              "on-surface-variant": "#3e484f",
              "primary": "#00668a"
            },
            fontFamily: {
              "headline": ["Plus Jakarta Sans"],
              "body": ["Inter"],
              "label": ["Inter"],
              "mono": ["JetBrains Mono"]
            },
            borderRadius: {"DEFAULT": "0.25rem", "lg": "0.5rem", "xl": "0.75rem", "full": "9999px"},
          },
        },
      }
    </script>
<style>
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        body { font-family: 'Inter', sans-serif; }
        h1, h2, h3 { font-family: 'Plus Jakarta Sans', sans-serif; }
        .mono-text { font-family: 'JetBrains Mono', monospace; }
    </style>
</head>
<body class="bg-surface text-on-surface">
<!-- SideNavBar -->
<aside class="flex flex-col fixed left-0 top-0 h-full overflow-y-auto w-[240px] border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 z-50">
<div class="p-6">
<div class="text-xl font-bold text-slate-900 dark:text-white font-plus-jakarta">PS-CRM Delhi</div>
<div class="text-xs text-on-surface-variant mt-1 font-medium">Public Service CRM</div>
</div>
<nav class="flex-1 px-4 space-y-1 mt-4">
<a class="flex items-center gap-3 px-3 py-2.5 text-slate-600 dark:text-slate-400 font-plus-jakarta text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors rounded-lg" href="#">
<span class="material-symbols-outlined" data-icon="dashboard">dashboard</span>
<span>Dashboard</span>
</a>
<a class="flex items-center gap-3 px-3 py-2.5 bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 border-r-4 border-sky-500 font-plus-jakarta text-sm font-medium transition-colors rounded-l-lg scale-[0.98]" href="#">
<span class="material-symbols-outlined" data-icon="assignment">assignment</span>
<span>My Complaints</span>
</a>
<a class="flex items-center gap-3 px-3 py-2.5 text-slate-600 dark:text-slate-400 font-plus-jakarta text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors rounded-lg" href="#">
<span class="material-symbols-outlined" data-icon="add_circle">add_circle</span>
<span>Report Issue</span>
</a>
<a class="flex items-center gap-3 px-3 py-2.5 text-slate-600 dark:text-slate-400 font-plus-jakarta text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors rounded-lg" href="#">
<span class="material-symbols-outlined" data-icon="notifications">notifications</span>
<span>Notifications</span>
</a>
<div class="pt-8 pb-4">
<div class="px-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Support</div>
</div>
<a class="flex items-center gap-3 px-3 py-2.5 text-slate-600 dark:text-slate-400 font-plus-jakarta text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors rounded-lg" href="#">
<span class="material-symbols-outlined" data-icon="help">help</span>
<span>Help</span>
</a>
<a class="flex items-center gap-3 px-3 py-2.5 text-slate-600 dark:text-slate-400 font-plus-jakarta text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors rounded-lg" href="#">
<span class="material-symbols-outlined" data-icon="settings">settings</span>
<span>Settings</span>
</a>
<a class="flex items-center gap-3 px-3 py-2.5 text-slate-600 dark:text-slate-400 font-plus-jakarta text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors rounded-lg mt-auto" href="#">
<span class="material-symbols-outlined" data-icon="logout">logout</span>
<span>Logout</span>
</a>
</nav>
<div class="p-6 mt-auto border-t border-outline-variant/10">
<div class="flex items-center gap-3">
<div class="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold text-xs">RK</div>
<div>
<p class="text-xs font-bold">Rajesh Kumar</p>
<p class="text-[10px] text-on-surface-variant">Citizen ID: 99281</p>
</div>
</div>
</div>
</aside>
<!-- Main Content Area -->
<main class="ml-[240px] min-h-screen">
<!-- TopAppBar -->
<header class="flex items-center justify-between px-6 h-[60px] w-full sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm">
<div class="flex items-center flex-1 max-w-xl">
<div class="relative w-full">
<span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg" data-icon="search">search</span>
<input class="w-full pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-full text-sm focus:ring-2 focus:ring-sky-500/20 placeholder:text-slate-400" placeholder="Search complaints, tickets or departments..." type="text"/>
</div>
</div>
<div class="flex items-center gap-6">
<button class="relative text-slate-500 hover:text-sky-500 transition-all">
<span class="material-symbols-outlined" data-icon="notifications">notifications</span>
<span class="absolute top-0 right-0 w-2 h-2 bg-error rounded-full border-2 border-white"></span>
</button>
<div class="h-6 w-px bg-slate-200"></div>
<div class="flex items-center gap-3 cursor-pointer group">
<div class="text-right hidden sm:block">
<p class="text-xs font-bold group-hover:text-primary transition-colors">Rajesh Kumar</p>
<p class="text-[10px] text-on-surface-variant">Verified Resident</p>
</div>
<div class="w-8 h-8 rounded-full bg-surface-container-high border border-outline-variant/20 flex items-center justify-center font-bold text-xs text-on-surface">RK</div>
</div>
</div>
</header>
<!-- Content Area -->
<div class="p-6 max-w-7xl mx-auto">
<!-- Breadcrumb -->
<nav class="flex items-center gap-2 text-xs font-medium mb-6">
<a class="text-on-surface-variant hover:text-primary" href="#">Dashboard</a>
<span class="material-symbols-outlined text-[14px] text-outline-variant" data-icon="chevron_right">chevron_right</span>
<a class="text-on-surface-variant hover:text-primary" href="#">My Complaints</a>
<span class="material-symbols-outlined text-[14px] text-outline-variant" data-icon="chevron_right">chevron_right</span>
<span class="text-primary-container font-semibold">#GR-2024-04821</span>
</nav>
<!-- Page Header -->
<div class="flex items-center justify-between mb-8">
<div class="flex items-center gap-4">
<h1 class="text-[22px] font-bold text-on-background">Complaint #GR-2024-04821</h1>
<span class="px-3 py-1 bg-sky-50 text-sky-600 rounded-full text-xs font-bold border border-sky-100">In Progress</span>
</div>
<div class="flex items-center gap-3">
<button class="flex items-center gap-2 px-4 py-2 border border-outline-variant/30 rounded-lg text-sm font-semibold hover:bg-white transition-colors">
<span class="material-symbols-outlined text-lg" data-icon="share">share</span>
                        Share
                    </button>
<button class="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-semibold hover:bg-primary-container transition-all">
<span class="material-symbols-outlined text-lg" data-icon="download">download</span>
                        Export PDF
                    </button>
</div>
</div>
<!-- Main Layout Grid -->
<div class="grid grid-cols-1 md:grid-cols-[63%_1fr] gap-6 items-start">
<!-- LEFT COLUMN -->
<div class="space-y-6">
<!-- Summary Card -->
<section class="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/5">
<div class="flex items-start justify-between">
<div class="flex gap-4">
<div class="w-12 h-12 bg-surface-container-low rounded-xl flex items-center justify-center text-primary">
<span class="material-symbols-outlined text-3xl" data-icon="waves">waves</span>
</div>
<div>
<h2 class="text-lg font-bold text-on-surface leading-tight">Drainage Blockage</h2>
<div class="flex flex-col gap-1 mt-2">
<div class="flex items-center gap-2 text-on-surface-variant text-sm">
<span class="material-symbols-outlined text-base" data-icon="location_on">location_on</span>
<span>Bharat Nagar Metro Station, North Delhi</span>
</div>
<div class="flex items-center gap-2 text-on-surface-variant text-sm">
<span class="material-symbols-outlined text-base" data-icon="schedule">schedule</span>
<span>Reported on 24 Oct, 2024 • 09:45 AM</span>
</div>
</div>
<div class="mt-4 px-3 py-1 bg-surface-container-low rounded inline-block">
<span class="text-[10px] text-on-surface-variant uppercase tracking-wider font-bold block">Grievance ID</span>
<span class="mono-text text-sm font-semibold text-primary">#GR-2024-04821</span>
</div>
</div>
</div>
<div class="relative group cursor-zoom-in">
<img class="w-[120px] h-[90px] object-cover rounded-lg border border-outline-variant/20" data-alt="Blocked drain with debris near metro station" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDvyQOj72oc5_CbvoNF1TfTmrOAKWUw-VUuDGK6MIOv4TB0QEbUJyL5-JRKhBjYK27Q9Ns7JzEfYgYK9JceQVT9o8RFdMV71MYUPGnyiYj0EWsQq53KGzKlmehz17R--0EOhRezem4GZ7segA540g40b7B__xqAnPIttQ2_nsFWqxgTGPiGDc11bRDncWHorZDm6dcE9G4Hlxt7uGKJO90CQaO4zlqMmE1mBOtd47qq06oTBnPrdo1XRbsjbld1uraQKepjot-R2_L2"/>
<div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
<span class="material-symbols-outlined text-white" data-icon="fullscreen">fullscreen</span>
</div>
</div>
</div>
</section>
<!-- Timeline Card -->
<section class="bg-surface-container-lowest rounded-xl p-8 shadow-sm border border-outline-variant/5">
<h3 class="text-base font-bold mb-8 flex items-center gap-2">
<span class="material-symbols-outlined text-primary" data-icon="history">history</span>
                            Activity Timeline
                        </h3>
<div class="relative space-y-0">
<!-- Step 1: Completed -->
<div class="flex gap-6 pb-10 relative">
<div class="absolute left-4 top-8 bottom-0 w-0.5 bg-tertiary-container"></div>
<div class="relative z-10 w-8 h-8 rounded-full bg-tertiary-container flex items-center justify-center text-on-tertiary-fixed-variant">
<span class="material-symbols-outlined text-lg" data-icon="check" style="font-variation-settings: 'wght' 700;">check</span>
</div>
<div class="flex-1">
<p class="text-sm font-bold text-on-surface">Complaint Registered</p>
<p class="text-xs text-on-surface-variant mt-1">Grievance submitted via Mobile App.</p>
<p class="text-[10px] text-on-surface-variant/70 mt-1 uppercase font-semibold">24 Oct, 09:45 AM</p>
</div>
</div>
<!-- Step 2: Completed -->
<div class="flex gap-6 pb-10 relative">
<div class="absolute left-4 top-8 bottom-0 w-0.5 bg-tertiary-container"></div>
<div class="relative z-10 w-8 h-8 rounded-full bg-tertiary-container flex items-center justify-center text-on-tertiary-fixed-variant">
<span class="material-symbols-outlined text-lg" data-icon="check" style="font-variation-settings: 'wght' 700;">check</span>
</div>
<div class="flex-1">
<p class="text-sm font-bold text-on-surface">Verified by Department</p>
<p class="text-xs text-on-surface-variant mt-1">Verification officer confirmed the location and severity.</p>
<p class="text-[10px] text-on-surface-variant/70 mt-1 uppercase font-semibold">24 Oct, 02:15 PM</p>
</div>
</div>
<!-- Step 3: Completed -->
<div class="flex gap-6 pb-10 relative">
<div class="absolute left-4 top-8 bottom-0 w-0.5 bg-tertiary-container"></div>
<div class="relative z-10 w-8 h-8 rounded-full bg-tertiary-container flex items-center justify-center text-on-tertiary-fixed-variant">
<span class="material-symbols-outlined text-lg" data-icon="check" style="font-variation-settings: 'wght' 700;">check</span>
</div>
<div class="flex-1">
<p class="text-sm font-bold text-on-surface">Contractor Assigned</p>
<p class="text-xs text-on-surface-variant mt-1">Ticket assigned to M/s Sharma Infrastructure Works.</p>
<p class="text-[10px] text-on-surface-variant/70 mt-1 uppercase font-semibold">25 Oct, 10:00 AM</p>
</div>
</div>
<!-- Step 4: Active -->
<div class="flex gap-6 pb-10 relative">
<div class="absolute left-4 top-8 bottom-0 w-0.5 border-l-2 border-dashed border-sky-300"></div>
<div class="relative z-10 w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 ring-4 ring-sky-50">
<span class="w-2.5 h-2.5 rounded-full bg-sky-600"></span>
</div>
<div class="flex-1">
<p class="text-sm font-bold text-sky-600">Work In Progress</p>
<p class="text-xs text-on-surface-variant mt-1">Contractor team is on-site clearing the blockage.</p>
<p class="text-[10px] text-sky-500 mt-1 uppercase font-bold tracking-tight">Active Step</p>
</div>
</div>
<!-- Step 5: Pending -->
<div class="flex gap-6 pb-10 relative">
<div class="absolute left-4 top-8 bottom-0 w-0.5 bg-surface-container"></div>
<div class="relative z-10 w-8 h-8 rounded-full bg-white border-2 border-surface-container flex items-center justify-center text-on-surface-variant/30">
</div>
<div class="flex-1">
<p class="text-sm font-medium text-on-surface-variant">Quality Audit</p>
<p class="text-xs text-on-surface-variant/60 mt-1">Post-repair inspection by departmental engineer.</p>
</div>
</div>
<!-- Step 6: Pending -->
<div class="flex gap-6 relative">
<div class="relative z-10 w-8 h-8 rounded-full bg-white border-2 border-surface-container flex items-center justify-center text-on-surface-variant/30">
</div>
<div class="flex-1">
<p class="text-sm font-medium text-on-surface-variant">Resolved &amp; Closed</p>
<p class="text-xs text-on-surface-variant/60 mt-1">Citizen feedback and final case closure.</p>
</div>
</div>
</div>
</section>
<!-- Action Banner -->
<div class="bg-[#f0f9ff] border border-[#bae6fd] rounded-xl p-6 flex items-center justify-between">
<div class="flex items-center gap-4">
<div class="w-10 h-10 bg-white rounded-full flex items-center justify-center text-primary-container">
<span class="material-symbols-outlined" data-icon="question_mark">question_mark</span>
</div>
<div>
<h3 class="text-sm font-bold text-on-primary-container">Has your issue been resolved?</h3>
<p class="text-xs text-on-primary-fixed-variant">Help us close this ticket by providing your feedback.</p>
</div>
</div>
<div class="flex gap-3">
<button class="px-5 py-2 bg-primary text-on-primary rounded-lg text-xs font-bold hover:bg-primary-container transition-all">Yes, it's been resolved</button>
<button class="px-5 py-2 border border-error text-error rounded-lg text-xs font-bold hover:bg-error/5 transition-colors">No, still an issue</button>
</div>
</div>
</div>
<!-- RIGHT COLUMN -->
<div class="space-y-6">
<!-- AI Summary Card -->
<section class="bg-[#f0f9ff] border-l-4 border-primary-container rounded-r-xl p-6 shadow-sm">
<div class="flex items-center justify-between mb-4">
<div class="flex items-center gap-2 text-primary">
<span class="material-symbols-outlined text-xl" data-icon="auto_awesome" style="font-variation-settings: 'FILL' 1;">auto_awesome</span>
<span class="text-xs font-bold tracking-tight uppercase">AI Summary</span>
</div>
<span class="text-[10px] text-on-surface-variant font-medium">Updated 2h ago</span>
</div>
<p class="text-sm text-on-primary-container leading-relaxed">
                            Drainage blockage at <span class="font-bold">Bharat Nagar Metro</span> has been escalated to Priority 1. Assigned to <span class="font-bold text-primary">M/s Sharma Infrastructure</span>. Heavy silt detected; specialized suction machine deployed. Awaiting field confirmation of clearance.
                        </p>
</section>
<!-- Assigned Contractor Card -->
<section class="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/5">
<h3 class="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-4">Assigned Contractor</h3>
<div class="flex items-center gap-4 mb-6">
<div class="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center text-primary font-bold text-lg border border-outline-variant/10">SS</div>
<div>
<h4 class="text-sm font-bold text-on-surface">M/s Sharma Infrastructure Works</h4>
<div class="flex items-center gap-3 mt-1">
<div class="flex items-center gap-1">
<span class="material-symbols-outlined text-sm text-secondary" data-icon="star" style="font-variation-settings: 'FILL' 1;">star</span>
<span class="text-xs font-bold">4.2</span>
</div>
<span class="text-on-surface-variant/40">•</span>
<span class="text-xs text-on-surface-variant">47 jobs completed</span>
</div>
</div>
</div>
<button class="w-full py-2.5 border border-outline-variant/30 rounded-lg text-xs font-bold hover:bg-surface-container-low transition-colors flex items-center justify-center gap-2">
<span class="material-symbols-outlined text-base" data-icon="chat">chat</span>
                            Contact via Official
                        </button>
</section>
<!-- SLA Tracker Card -->
<section class="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/5">
<h3 class="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-6">SLA Status</h3>
<div class="flex flex-col items-center">
<div class="relative w-32 h-32 flex items-center justify-center">
<!-- Circular Progress -->
<svg class="w-full h-full -rotate-90">
<circle class="text-surface-container-low" cx="64" cy="64" fill="transparent" r="58" stroke="currentColor" stroke-width="8"></circle>
<circle class="text-primary-container transition-all duration-1000" cx="64" cy="64" fill="transparent" r="58" stroke="currentColor" stroke-dasharray="364.4" stroke-dashoffset="160.3" stroke-width="8"></circle>
</svg>
<div class="absolute flex flex-col items-center">
<span class="text-xl font-extrabold text-on-surface">56%</span>
<span class="text-[10px] text-on-surface-variant font-medium">Time Used</span>
</div>
</div>
<div class="mt-6 text-center">
<p class="text-sm font-bold text-on-surface">23 days of 41</p>
<div class="flex items-center justify-center gap-1 mt-1 text-tertiary">
<span class="text-xs font-bold uppercase tracking-tight">On Track</span>
<span class="material-symbols-outlined text-sm" data-icon="check_circle" style="font-variation-settings: 'FILL' 1;">check_circle</span>
</div>
</div>
</div>
</section>
<!-- Escalation Card -->
<section class="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/5 border-t-4 border-t-error/10">
<div class="flex items-center gap-3 mb-3">
<div class="w-8 h-8 rounded-full bg-error-container flex items-center justify-center text-error">
<span class="material-symbols-outlined text-lg" data-icon="report">report</span>
</div>
<h3 class="text-sm font-bold text-on-surface">Need Help?</h3>
</div>
<p class="text-xs text-on-surface-variant leading-relaxed">
                            If your issue is being ignored or the resolution is unsatisfactory, you may raise a formal escalation to the Nodal Officer.
                        </p>
<button class="mt-4 flex items-center gap-2 text-error text-xs font-bold hover:translate-x-1 transition-transform group">
                            Raise an Escalation
                            <span class="material-symbols-outlined text-base" data-icon="arrow_forward">arrow_forward</span>
</button>
</section>
</div>
</div>
</div>
</main>
</body></html>

<!-- Submit Complaint - PS-CRM Delhi -->
<!DOCTYPE html>

<html class="light" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Submit Complaint - PS-CRM Delhi</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&amp;family=Inter:wght@400;500;600&amp;family=Fira+Code:wght@400;500&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            colors: {
              "surface-container-lowest": "#ffffff",
              "outline-variant": "#bdc8d1",
              "surface-container-high": "#dce9ff",
              "on-tertiary-fixed": "#002109",
              "surface-container-low": "#eff4ff",
              "primary-container": "#38bdf8",
              "on-error": "#ffffff",
              "tertiary-fixed-dim": "#4ae176",
              "on-tertiary-fixed-variant": "#005321",
              "on-primary": "#ffffff",
              "on-primary-container": "#004965",
              "error-container": "#ffdad6",
              "on-secondary-container": "#684000",
              "secondary-fixed-dim": "#ffb95f",
              "on-tertiary-container": "#004f20",
              "inverse-on-surface": "#eaf1ff",
              "surface": "#f8f9ff",
              "tertiary-container": "#2ccb63",
              "on-primary-fixed-variant": "#004c69",
              "on-error-container": "#93000a",
              "surface-bright": "#f8f9ff",
              "primary": "#00668a",
              "on-secondary-fixed": "#2a1700",
              "tertiary-fixed": "#6bff8f",
              "on-surface-variant": "#3e484f",
              "surface-tint": "#00668a",
              "surface-container-highest": "#d3e4fe",
              "inverse-primary": "#7bd0ff",
              "surface-dim": "#cbdbf5",
              "primary-fixed": "#c4e7ff",
              "surface-variant": "#d3e4fe",
              "surface-container": "#e5eeff",
              "outline": "#6e7980",
              "secondary": "#855300",
              "error": "#ba1a1a",
              "on-secondary-fixed-variant": "#653e00",
              "background": "#f8f9ff",
              "on-tertiary": "#ffffff",
              "on-surface": "#0b1c30",
              "on-secondary": "#ffffff",
              "inverse-surface": "#213145",
              "primary-fixed-dim": "#7bd0ff",
              "on-primary-fixed": "#001e2c",
              "secondary-fixed": "#ffddb8",
              "secondary-container": "#fea619",
              "tertiary": "#006e2f",
              "on-background": "#0b1c30"
            },
            fontFamily: {
              "headline": ["Plus Jakarta Sans"],
              "body": ["Inter"],
              "label": ["Inter"],
              "mono": ["Fira Code"]
            },
            borderRadius: {"DEFAULT": "0.25rem", "lg": "0.5rem", "xl": "0.75rem", "full": "9999px"},
          },
        },
      }
    </script>
<style>
      .material-symbols-outlined {
        font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
      }
      body { font-family: 'Inter', sans-serif; }
      h1, h2, h3 { font-family: 'Plus Jakarta Sans', sans-serif; }
    </style>
</head>
<body class="bg-surface text-on-surface selection:bg-primary-container selection:text-on-primary-container">
<!-- TopNavBar -->
<header class="fixed top-0 w-full z-50 bg-[#f8f9ff]/80 dark:bg-[#0b1c30]/80 backdrop-blur-xl shadow-[0_20px_50px_rgba(11,28,48,0.05)] flex justify-between items-center px-6 h-16 w-full">
<div class="flex items-center gap-8">
<span class="text-xl font-bold tracking-tight text-[#0b1c30] dark:text-[#f8f9ff]">PS-CRM Delhi</span>
</div>
<div class="flex items-center gap-4">
<div class="hidden md:flex items-center bg-surface-container-low px-3 py-1.5 rounded-full border border-outline-variant/20">
<span class="material-symbols-outlined text-on-surface-variant text-sm mr-2">search</span>
<input class="bg-transparent border-none text-sm focus:ring-0 p-0 w-48" placeholder="Search records..." type="text"/>
</div>
<button class="p-2 rounded-full hover:bg-[#eff4ff] transition-colors duration-150">
<span class="material-symbols-outlined text-on-surface-variant">notifications</span>
</button>
<button class="p-2 rounded-full hover:bg-[#eff4ff] transition-colors duration-150">
<span class="material-symbols-outlined text-on-surface-variant">help_outline</span>
</button>
<div class="w-8 h-8 rounded-full overflow-hidden border border-outline-variant/30">
<img alt="Rahul Kumar" data-alt="User profile avatar of Rahul Kumar" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDYN9bVDo_VaVTIpOFEcxsqF8wfgmtvvA2sGiTbTk-qAtU1sRW4ysf7LyjWdw-Cvc98Gg2rN_ZNie-wEX2GkZ3ihVhFBKyoDStuhB4D9_jtpvmwj4dspecSEqGzXiLkSmB3fCFqUIcYiuDixew-6y0Yipky6Ce0t6HxaP31k8B3ks-yVy9dsaA-dtEzgfACSzUlspsZjOeIoZGfGOPo2GGFoXVWnJSW1YDuXsMb9rSSxovWOv2DVl-dW5jdD_9SJKMiqH91mYw7ktyf"/>
</div>
</div>
</header>
<div class="flex pt-16 min-h-screen">
<!-- SideNavBar -->
<aside class="hidden md:flex flex-col h-[calc(100vh-64px)] w-64 p-4 gap-2 fixed left-0 bg-[#eff4ff] dark:bg-[#0b1c30]">
<nav class="flex-1 space-y-1">
<a class="flex items-center gap-3 px-4 py-3 text-[#3e484f] hover:text-[#00668a] hover:bg-[#dce9ff] transition-all duration-200 rounded-lg font-medium text-sm" href="#">
<span class="material-symbols-outlined">dashboard</span>
                    Dashboard
                </a>
<!-- Active Tab: Report Issue -->
<a class="flex items-center gap-3 px-4 py-3 bg-[#ffffff] dark:bg-[#1a2f47] text-[#00668a] dark:text-[#38bdf8] font-bold rounded-lg shadow-sm transition-all duration-200 text-sm" href="#">
<span class="material-symbols-outlined">report_problem</span>
                    Report Issue
                </a>
<a class="flex items-center gap-3 px-4 py-3 text-[#3e484f] hover:text-[#00668a] hover:bg-[#dce9ff] transition-all duration-200 rounded-lg font-medium text-sm" href="#">
<span class="material-symbols-outlined">assignment</span>
                    My Grievances
                </a>
<a class="flex items-center gap-3 px-4 py-3 text-[#3e484f] hover:text-[#00668a] hover:bg-[#dce9ff] transition-all duration-200 rounded-lg font-medium text-sm" href="#">
<span class="material-symbols-outlined">map</span>
                    Civic Map
                </a>
<a class="flex items-center gap-3 px-4 py-3 text-[#3e484f] hover:text-[#00668a] hover:bg-[#dce9ff] transition-all duration-200 rounded-lg font-medium text-sm" href="#">
<span class="material-symbols-outlined">settings</span>
                    Settings
                </a>
</nav>
<div class="mt-auto pt-4 border-t border-outline-variant/10">
<button class="w-full flex items-center justify-center gap-2 py-3 bg-error text-on-error rounded-xl font-bold shadow-lg shadow-error/20 active:scale-95 transition-transform">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">emergency</span>
                    Emergency SOS
                </button>
</div>
</aside>
<!-- Main Content Canvas -->
<main class="flex-1 md:ml-64 p-8 bg-surface">
<!-- Breadcrumbs -->
<nav class="flex items-center gap-2 mb-6">
<a class="text-[#38bdf8] text-sm font-medium hover:underline" href="#">Dashboard</a>
<span class="material-symbols-outlined text-outline text-xs">chevron_right</span>
<span class="text-on-surface-variant text-sm">Submit Complaint</span>
</nav>
<!-- Page Header -->
<header class="mb-10">
<h1 class="text-[22px] font-extrabold text-[#0f172a] tracking-tight leading-tight">Submit a Complaint</h1>
<p class="text-on-surface-variant mt-1 text-sm font-medium">Report a civic issue in your area. Avg. response time: 3–5 working days.</p>
</header>
<!-- Main Content Card -->
<div class="max-w-[700px] space-y-8">
<!-- Block 1: Photo Upload -->
<section class="space-y-4">
<div>
<h3 class="text-sm font-bold text-on-surface">Attach Photos</h3>
<p class="text-xs text-on-surface-variant mt-0.5">Upload up to 5 photos of the issue for faster verification.</p>
</div>
<div class="flex flex-wrap gap-4 items-center">
<!-- Preview Thumbnails -->
<div class="relative w-20 h-20 rounded-xl overflow-hidden group shadow-sm">
<img class="w-full h-full object-cover" data-alt="Close up of a broken storm drain cover on a street" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC4J4N4pkE_YXcQrsuenDomoa7DBoqI6CX-yUawdyuf0jG2kA9x8gm8NNzh1Cgn_Ft3zJMcq9gGq-vu7ylXjP2jIXTZ3tOwUo23UfXBEv6aJwL42sxf5XgzeEyIdamJeWueneljAa0uPhc_mSQt4aH6qzu4598KcOjThXvisaF9GiRXmi2fIODddj1fsfODKyfugeuJbabbAHyLpOs7CTyNbdCIFBqOlmIWcrw-MqIMbl7TuUzQ5izR3k4p43cvqG8rmswZYzgizi2C"/>
<button class="absolute top-1 right-1 bg-on-background/60 text-white rounded-full p-0.5 hover:bg-error transition-colors">
<span class="material-symbols-outlined text-[14px]">close</span>
</button>
</div>
<div class="relative w-20 h-20 rounded-xl overflow-hidden group shadow-sm">
<img class="w-full h-full object-cover" data-alt="Deep pothole in the middle of a concrete road" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBbcMCzcqQl_FcJoDRtDMSIL8mAn9qAnlSiA68BBulI9rmBgTiIgaFW6TH2Q-sQlcS73gmOHglMzNDG-nGpkS-Lj2Xh8lUlz8QMwM4iVkwilWO8-KueeZlO7qlUolWvq1SicWWZlinRm0iS6IjiPIVUApcre_xw0ng-MJeGCUG5eRXssHdyQ71jhcH1lTgwWl6QNFxQilpWLxQqrSh8Yvn8esTicELBtMWfeSuVXDzmaO6FSM1slrADgS_sXVXbMwmku47rgsp8Avex"/>
<button class="absolute top-1 right-1 bg-on-background/60 text-white rounded-full p-0.5 hover:bg-error transition-colors">
<span class="material-symbols-outlined text-[14px]">close</span>
</button>
</div>
<div class="relative w-20 h-20 rounded-xl overflow-hidden group shadow-sm">
<img class="w-full h-full object-cover" data-alt="Cracked road surface showing structural damage" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAW2fkjxeP_M4z-P7mQGR283tB5pN3tlT8_Au17O6ry8PxuWiXjh7QzB81cGzmaxDqiDnRRNic7HRNOEpI2dRACA6DAji_PP_9LDxU4HjT8DwmDguzwGErTUwmdkxgR5_dkzkp-MnRw8DMGt4MstXzVH8wkUhKUayrzyAC1eZeUrMFEIYlg4UOkGGo-hq4WWnMrCUJM0UnN_aXjYGttlxO2hnlACc3-CbqD7nwZYcbJ3yDhHuwe08MO2GyJMvrVmOmuMMySVpaIy4fY"/>
<button class="absolute top-1 right-1 bg-on-background/60 text-white rounded-full p-0.5 hover:bg-error transition-colors">
<span class="material-symbols-outlined text-[14px]">close</span>
</button>
</div>
<!-- Dropzone -->
<div class="w-20 h-20 border-2 border-dashed border-outline-variant rounded-xl flex items-center justify-center hover:bg-surface-container-low cursor-pointer transition-colors text-primary">
<span class="material-symbols-outlined text-2xl">add</span>
</div>
<div class="flex-1 min-w-[200px] h-24 border-2 border-dashed border-outline-variant/40 rounded-xl flex flex-col items-center justify-center bg-surface-container-lowest hover:border-primary-container transition-all group">
<span class="material-symbols-outlined text-outline-variant group-hover:text-primary-container mb-1">cloud_upload</span>
<span class="text-[11px] font-bold text-outline uppercase tracking-wider">Drop files here</span>
</div>
</div>
</section>
<!-- Block 2: Location -->
<section class="space-y-4">
<div>
<h3 class="text-sm font-bold text-on-surface">Complaint Location</h3>
<p class="text-xs text-on-surface-variant mt-0.5">We've detected your location via GPS. Please adjust the pin if needed.</p>
</div>
<div class="bg-surface-container-lowest rounded-xl overflow-hidden border border-outline-variant/10 shadow-sm">
<!-- Map Header -->
<div class="px-4 py-2 bg-surface-container-low flex items-center justify-between">
<div class="flex items-center gap-2">
<div class="w-2 h-2 bg-tertiary-container rounded-full animate-pulse"></div>
<span class="text-[10px] font-bold text-on-surface-variant uppercase tracking-tight">GPS Active • High Accuracy</span>
</div>
<span class="text-[10px] font-mono text-outline">28.6139° N, 77.2090° E</span>
</div>
<!-- Map Area -->
<div class="relative h-[200px] bg-surface-dim">
<img class="w-full h-full object-cover opacity-60 mix-blend-multiply" data-alt="A stylized map layout of a city street grid" data-location="Delhi" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDOsA0nrto3UyDLJbruIHtV9-wqVjuhHt-w1ovQqWAC7IFvftTil_I1zECBM4EdWfNLsMONW9pOAq1YXaBcWX1VtbdodpvL9hQjnV0g8RwcG-OzEcCG5Io1q1aydJ_9WUEmJmAiJXQ_9Tr9wheBVV5gBs5ikie6bYefpJ4VOMGNcCmVfWfR3ONFGD20N9JpqODvCw_TgG_eDP1WL08YPv4ev8Q8f7eyTS9n8hZLFceKUYSEM3EWVZOUTokbShPw1terYVXZ_PYpmfId"/>
<!-- Blue Pin -->
<div class="absolute inset-0 flex items-center justify-center pointer-events-none">
<div class="relative">
<span class="material-symbols-outlined text-primary text-4xl" style="font-variation-settings: 'FILL' 1;">location_on</span>
<div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-1 bg-on-background/20 rounded-full blur-sm"></div>
</div>
</div>
</div>
<!-- Map Footer -->
<div class="p-3 bg-surface-container-lowest flex justify-end">
<button class="flex items-center gap-1.5 px-3 py-1.5 text-primary text-xs font-bold hover:bg-primary-container/10 rounded-lg transition-colors">
<span class="material-symbols-outlined text-sm">my_location</span>
                                Retry GPS
                            </button>
</div>
</div>
</section>
<!-- Block 3: Description -->
<section class="space-y-4">
<div class="flex justify-between items-end">
<div>
<h3 class="text-sm font-bold text-on-surface">Describe the Issue</h3>
<p class="text-xs text-on-surface-variant mt-0.5">Write in any language. Be as specific as possible.</p>
</div>
<span class="text-[10px] font-bold text-outline-variant tracking-wider uppercase">Voice support available</span>
</div>
<div class="relative group">
<textarea class="w-full h-[130px] p-4 bg-surface-container-low border-b-2 border-outline-variant/30 focus:border-primary focus:ring-0 rounded-t-xl text-sm transition-all resize-none placeholder:text-outline/50" placeholder="Example: The streetlight near Gate 4 is flickering since yesterday..."></textarea>
<button class="absolute bottom-3 right-3 p-2 bg-white text-primary rounded-full shadow-md hover:scale-110 active:scale-90 transition-all">
<span class="material-symbols-outlined">mic</span>
</button>
</div>
<div class="flex items-center justify-between">
<div class="flex gap-2">
<button class="px-3 py-1 bg-primary-container text-on-primary-container text-xs font-bold rounded-full">English</button>
<button class="px-3 py-1 bg-surface-container-low text-on-surface-variant text-xs font-medium rounded-full hover:bg-surface-container-high transition-colors">Hindi</button>
<button class="px-3 py-1 bg-surface-container-low text-on-surface-variant text-xs font-medium rounded-full hover:bg-surface-container-high transition-colors">Marathi</button>
<button class="px-3 py-1 bg-surface-container-low text-on-surface-variant text-xs font-medium rounded-full hover:bg-surface-container-high transition-colors">Bengali</button>
</div>
<div class="flex items-center gap-1.5 grayscale opacity-60">
<span class="text-[9px] font-bold text-outline uppercase tracking-widest">Powered by</span>
<span class="text-[11px] font-extrabold text-on-surface tracking-tighter">Bhashini</span>
</div>
</div>
</section>
<!-- Block 4: Error + Submit -->
<section class="pt-6 space-y-4">
<div class="flex items-start gap-3 p-4 bg-error-container/30 border border-error/10 rounded-xl">
<span class="material-symbols-outlined text-error text-sm mt-0.5">error_outline</span>
<div>
<p class="text-xs font-bold text-error">Complaint submission failed</p>
<p class="text-[11px] text-error/80 mt-0.5 leading-relaxed">Please check your internet connection or ensure all required fields are filled and try again.</p>
</div>
</div>
<button class="w-full py-4 bg-primary-container text-[#0f172a] font-black text-sm uppercase tracking-widest rounded-xl shadow-lg shadow-primary-container/25 hover:brightness-105 active:scale-[0.98] transition-all">
                        Submit Complaint
                    </button>
<footer class="flex items-center justify-center gap-2 pt-4">
<span class="material-symbols-outlined text-outline-variant text-base" style="font-variation-settings: 'FILL' 1;">verified_user</span>
<p class="text-[10px] font-medium text-outline-variant tracking-tight">Secured and verified by Delhi Municipal Services</p>
</footer>
</section>
</div>
</main>
</div>
</body></html>

<!-- Public Map - PS-CRM Delhi -->
<!DOCTYPE html>

<html class="light" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Delhi Civic IQ | Public Map</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&amp;family=Inter:wght@400;500;600&amp;family=Berkeley+Mono&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    colors: {
                        "primary-container": "#38bdf8",
                        "on-surface": "#0b1c30",
                        "on-background": "#0b1c30",
                        "tertiary-container": "#2ccb63",
                        "surface-dim": "#cbdbf5",
                        "surface-container-highest": "#d3e4fe",
                        "on-tertiary-container": "#004f20",
                        "surface-container-high": "#dce9ff",
                        "on-secondary-fixed": "#2a1700",
                        "error": "#ba1a1a",
                        "on-secondary-fixed-variant": "#653e00",
                        "surface-bright": "#f8f9ff",
                        "inverse-surface": "#213145",
                        "error-container": "#ffdad6",
                        "surface-variant": "#d3e4fe",
                        "on-secondary-container": "#684000",
                        "on-primary-fixed": "#001e2c",
                        "on-primary-fixed-variant": "#004c69",
                        "on-secondary": "#ffffff",
                        "outline-variant": "#bdc8d1",
                        "on-tertiary-fixed": "#002109",
                        "surface-container-low": "#eff4ff",
                        "inverse-primary": "#7bd0ff",
                        "inverse-on-surface": "#eaf1ff",
                        "secondary-fixed": "#ffddb8",
                        "secondary-fixed-dim": "#ffb95f",
                        "secondary": "#855300",
                        "primary": "#00668a",
                        "on-tertiary-fixed-variant": "#005321",
                        "tertiary-fixed-dim": "#4ae176",
                        "surface-tint": "#00668a",
                        "on-primary": "#ffffff",
                        "surface-container-lowest": "#ffffff",
                        "outline": "#6e7980",
                        "on-surface-variant": "#3e484f",
                        "tertiary-fixed": "#6bff8f",
                        "surface-container": "#e5eeff",
                        "surface": "#f8f9ff",
                        "primary-fixed-dim": "#7bd0ff",
                        "secondary-container": "#fea619",
                        "primary-fixed": "#c4e7ff",
                        "on-tertiary": "#ffffff",
                        "on-error": "#ffffff",
                        "tertiary": "#006e2f",
                        "on-error-container": "#93000a",
                        "background": "#f8f9ff",
                        "on-primary-container": "#004965"
                    },
                    fontFamily: {
                        "headline": ["Plus Jakarta Sans"],
                        "body": ["Inter"],
                        "label": ["Inter"]
                    },
                    borderRadius: {"DEFAULT": "0.25rem", "lg": "0.5rem", "xl": "0.75rem", "full": "9999px"},
                },
            },
        }
    </script>
<style>
        body { font-family: 'Inter', sans-serif; }
        h1, h2, h3 { font-family: 'Plus Jakarta Sans', sans-serif; }
        .mono { font-family: 'Berkeley Mono', monospace; }
        .map-gradient {
            background: radial-gradient(circle at center, transparent 0%, rgba(239, 244, 255, 0.4) 100%);
        }
    </style>
</head>
<body class="bg-background text-on-background overflow-hidden h-screen flex flex-col">
<!-- Top Navigation Bar -->
<nav class="h-16 flex items-center justify-between px-8 bg-surface/80 backdrop-blur-md border-b border-outline-variant/15 z-50">
<div class="flex items-center gap-3">
<span class="text-2xl font-extrabold text-primary tracking-tight">PS-CRM</span>
<div class="h-4 w-[1px] bg-outline-variant/30 mx-2"></div>
<span class="text-sm font-semibold text-on-surface-variant tracking-wide">DELHI CIVIC IQ</span>
</div>
<div class="flex items-center gap-6">
<div class="flex items-center gap-2 px-3 py-1.5 bg-surface-container-low rounded-full">
<span class="w-2 h-2 rounded-full bg-tertiary-container animate-pulse"></span>
<span class="text-[10px] font-bold uppercase tracking-widest text-on-tertiary-fixed-variant">Live System Status</span>
</div>
<button class="flex items-center gap-2 bg-primary text-on-primary px-5 py-2 rounded-lg text-sm font-semibold hover:bg-primary-container hover:text-on-primary-container transition-all active:scale-95 shadow-sm">
                Login to track your complaint
                <span class="material-symbols-outlined text-sm">arrow_forward</span>
</button>
</div>
</nav>
<main class="flex-1 flex overflow-hidden">
<!-- Left Panel: Live Summary -->
<aside class="w-[360px] bg-surface-container-low flex flex-col z-40 shadow-xl overflow-y-auto">
<div class="p-8 space-y-8">
<!-- Header Section -->
<header>
<h2 class="text-2xl font-extrabold text-on-surface tracking-tight mb-1">Live Complaint Summary</h2>
<p class="text-on-surface-variant text-sm font-medium">Real-time civic performance metrics across the capital region.</p>
</header>
<!-- Stats Grid (Bento Style) -->
<div class="grid grid-cols-2 gap-3">
<div class="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/10">
<span class="text-[10px] font-bold uppercase tracking-tighter text-on-surface-variant mb-1 block">Active</span>
<div class="text-2xl font-extrabold text-primary mono">1,402</div>
</div>
<div class="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/10">
<span class="text-[10px] font-bold uppercase tracking-tighter text-on-surface-variant mb-1 block">Resolved</span>
<div class="text-2xl font-extrabold text-tertiary mono">8,921</div>
</div>
<div class="col-span-2 bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/10 flex items-center justify-between">
<div>
<span class="text-[10px] font-bold uppercase tracking-tighter text-on-surface-variant mb-1 block">SLA Period</span>
<div class="text-lg font-bold text-on-surface">48 Hours Avg.</div>
</div>
<div class="text-right">
<span class="text-[10px] font-bold uppercase tracking-tighter text-on-surface-variant mb-1 block">Compliance</span>
<div class="text-lg font-bold text-tertiary-container">94.2%</div>
</div>
</div>
</div>
<!-- Category Breakdown -->
<section class="space-y-4">
<h3 class="text-xs font-bold uppercase tracking-widest text-outline">Category Breakdown</h3>
<div class="space-y-5">
<!-- Item 1: Waste Management -->
<div class="space-y-2">
<div class="flex justify-between items-end">
<span class="text-sm font-semibold text-on-surface">Waste Management</span>
<span class="text-xs font-medium mono text-on-surface-variant">412 Issues</span>
</div>
<div class="h-1.5 w-full bg-surface-dim rounded-full overflow-hidden">
<div class="h-full bg-primary" style="width: 75%"></div>
</div>
</div>
<!-- Item 2: Street Lighting -->
<div class="space-y-2">
<div class="flex justify-between items-end">
<span class="text-sm font-semibold text-on-surface">Street Lighting</span>
<span class="text-xs font-medium mono text-on-surface-variant">285 Issues</span>
</div>
<div class="h-1.5 w-full bg-surface-dim rounded-full overflow-hidden">
<div class="h-full bg-secondary-container" style="width: 55%"></div>
</div>
</div>
<!-- Item 3: Water Supply -->
<div class="space-y-2">
<div class="flex justify-between items-end">
<span class="text-sm font-semibold text-on-surface">Water Supply</span>
<span class="text-xs font-medium mono text-on-surface-variant">198 Issues</span>
</div>
<div class="h-1.5 w-full bg-surface-dim rounded-full overflow-hidden">
<div class="h-full bg-primary-container" style="width: 38%"></div>
</div>
</div>
<!-- Item 4: Road Maintenance -->
<div class="space-y-2">
<div class="flex justify-between items-end">
<span class="text-sm font-semibold text-on-surface">Road Maintenance</span>
<span class="text-xs font-medium mono text-on-surface-variant">144 Issues</span>
</div>
<div class="h-1.5 w-full bg-surface-dim rounded-full overflow-hidden">
<div class="h-full bg-error" style="width: 25%"></div>
</div>
</div>
</div>
</section>
<!-- Info Card -->
<div class="bg-primary/5 rounded-xl p-5 border border-primary/10">
<div class="flex gap-3">
<span class="material-symbols-outlined text-primary" style="font-variation-settings: 'FILL' 1;">info</span>
<div class="space-y-1">
<p class="text-xs font-bold text-primary uppercase tracking-tight">Public Insight</p>
<p class="text-xs leading-relaxed text-on-primary-fixed-variant">This map displays anonymized clusters of reported civic issues to help citizens visualize city-wide performance and demand. Use filters to narrow down by ward.</p>
</div>
</div>
</div>
</div>
</aside>
<!-- Right Panel: Full Height Map Interface -->
<section class="flex-1 relative bg-[#f1f5f9]">
<!-- Placeholder Map Visual -->
<div class="absolute inset-0 z-0">
<img alt="Map of Delhi" class="w-full h-full object-cover opacity-40 grayscale-[0.3]" data-alt="Abstract map layout of Delhi city streets and districts" data-location="Delhi, India" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD4r7r4FeB4KrA1iMzsp5-Q60oPt230Y0SxotHc-EyOTeK_2DFM8HP7GaogBX3lCiI8hQyh-MIie6hBvGKm121Z9V5BaUtwR2NJGlUT92HpvcReLnjRnK3m7buaAvkp19hpix1HjCZvfXrxMTZ_2643aBgB46tFI-7NBxrYsHe_1YS_x4C2y56B0dxa20ZUE1xdBNPal4ToO-NRySrZiVNU9jpAUwGOnLrJw97Mt5cJKTGr4ZLdEJMapKph2i3WkH_RCZMzrmquBZGK"/>
<div class="absolute inset-0 map-gradient"></div>
</div>
<!-- Map UI Overlays -->
<!-- Floating Markers (Simulation) -->
<div class="absolute inset-0 z-10 pointer-events-none">
<!-- Red Cluster -->
<div class="absolute top-[20%] left-[30%] pointer-events-auto cursor-pointer group">
<div class="w-10 h-10 bg-error/90 rounded-full flex items-center justify-center text-white font-bold mono shadow-lg border-2 border-white transition-transform hover:scale-110">84</div>
<div class="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-on-background text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">Critical Issues</div>
</div>
<!-- Sky Blue Cluster -->
<div class="absolute top-[45%] left-[55%] pointer-events-auto cursor-pointer group">
<div class="w-12 h-12 bg-primary-container/90 rounded-full flex items-center justify-center text-on-primary-container font-bold mono shadow-lg border-2 border-white transition-transform hover:scale-110">156</div>
<div class="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-on-background text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">Water Supply</div>
</div>
<!-- Green Cluster -->
<div class="absolute bottom-[25%] left-[20%] pointer-events-auto cursor-pointer group">
<div class="w-8 h-8 bg-tertiary-container/90 rounded-full flex items-center justify-center text-on-tertiary-container font-bold mono shadow-lg border-2 border-white transition-transform hover:scale-110">23</div>
<div class="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-on-background text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">Parks &amp; Greenery</div>
</div>
<!-- Orange Cluster -->
<div class="absolute top-[30%] right-[25%] pointer-events-auto cursor-pointer group">
<div class="w-14 h-14 bg-secondary-container/90 rounded-full flex items-center justify-center text-on-secondary-container font-bold mono shadow-lg border-2 border-white transition-transform hover:scale-110">214</div>
<div class="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-on-background text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">Street Lighting</div>
</div>
</div>
<!-- Map Controls (Top Right) -->
<div class="absolute top-6 right-6 flex flex-col gap-3 z-20">
<div class="bg-surface-container-lowest rounded-xl shadow-xl overflow-hidden border border-outline-variant/20 flex flex-col">
<button class="p-3 text-on-surface hover:bg-surface-container-low transition-colors border-b border-outline-variant/10">
<span class="material-symbols-outlined">add</span>
</button>
<button class="p-3 text-on-surface hover:bg-surface-container-low transition-colors">
<span class="material-symbols-outlined">remove</span>
</button>
</div>
<button class="bg-surface-container-lowest p-3 rounded-xl shadow-xl border border-outline-variant/20 text-on-surface hover:bg-surface-container-low transition-colors">
<span class="material-symbols-outlined">my_location</span>
</button>
</div>
<!-- Layer Toggle (Bottom Left) -->
<div class="absolute bottom-12 left-6 z-20">
<div class="bg-surface-container-lowest/95 backdrop-blur-md p-4 rounded-xl shadow-2xl border border-outline-variant/20 flex gap-4">
<div class="flex items-center gap-3 pr-4 border-r border-outline-variant/30">
<div class="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
<span class="material-symbols-outlined">layers</span>
</div>
<div class="flex flex-col">
<span class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Map Layer</span>
<span class="text-sm font-semibold">Heatmap View</span>
</div>
</div>
<div class="flex gap-2">
<button class="px-4 py-2 bg-primary text-on-primary rounded-lg text-xs font-bold transition-all shadow-md">Heatmap</button>
<button class="px-4 py-2 bg-surface-container-high text-on-surface rounded-lg text-xs font-bold hover:bg-surface-container-highest transition-all">Clusters</button>
<button class="px-4 py-2 bg-surface-container-high text-on-surface rounded-lg text-xs font-bold hover:bg-surface-container-highest transition-all">Satellite</button>
</div>
</div>
</div>
<!-- Bottom Map Bar -->
<footer class="absolute bottom-0 w-full h-10 bg-on-background/90 backdrop-blur-sm text-white flex items-center justify-between px-6 z-30">
<div class="flex items-center gap-4">
<div class="flex items-center gap-2">
<span class="w-2 h-2 rounded-full bg-tertiary-container"></span>
<span class="text-[10px] font-bold uppercase tracking-widest opacity-80">Live Data Status: Optimal</span>
</div>
<div class="h-4 w-[1px] bg-white/20"></div>
<div class="text-[10px] font-medium tracking-tight opacity-70">Last Refresh: Today, 14:32:01 IST</div>
</div>
<div class="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest opacity-80">
<span>Delhi Geo-Node: 09.21.3</span>
<span class="mono">28.6139° N, 77.2090° E</span>
</div>
</footer>
</section>
</main>
</body></html>

<!-- Notifications - PS-CRM Delhi -->
<!DOCTYPE html>

<html class="light" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Notifications — Delhi Civic IQ</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&amp;family=Inter:wght@400;500;600&amp;family=Berkeley+Mono&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            colors: {
              "primary-container": "#38bdf8",
              "on-surface": "#0b1c30",
              "on-background": "#0b1c30",
              "tertiary-container": "#2ccb63",
              "surface-dim": "#cbdbf5",
              "surface-container-highest": "#d3e4fe",
              "on-tertiary-container": "#004f20",
              "surface-container-high": "#dce9ff",
              "on-secondary-fixed": "#2a1700",
              "error": "#ba1a1a",
              "on-secondary-fixed-variant": "#653e00",
              "surface-bright": "#f8f9ff",
              "inverse-surface": "#213145",
              "error-container": "#ffdad6",
              "surface-variant": "#d3e4fe",
              "on-secondary-container": "#684000",
              "on-primary-fixed": "#001e2c",
              "on-primary-fixed-variant": "#004c69",
              "on-secondary": "#ffffff",
              "outline-variant": "#bdc8d1",
              "on-tertiary-fixed": "#002109",
              "surface-container-low": "#eff4ff",
              "inverse-primary": "#7bd0ff",
              "inverse-on-surface": "#eaf1ff",
              "secondary-fixed": "#ffddb8",
              "secondary-fixed-dim": "#ffb95f",
              "secondary": "#855300",
              "primary": "#00668a",
              "on-tertiary-fixed-variant": "#005321",
              "tertiary-fixed-dim": "#4ae176",
              "surface-tint": "#00668a",
              "on-primary": "#ffffff",
              "surface-container-lowest": "#ffffff",
              "outline": "#6e7980",
              "on-surface-variant": "#3e484f",
              "tertiary-fixed": "#6bff8f",
              "surface-container": "#e5eeff",
              "surface": "#f8f9ff",
              "primary-fixed-dim": "#7bd0ff",
              "secondary-container": "#fea619",
              "primary-fixed": "#c4e7ff",
              "on-tertiary": "#ffffff",
              "on-error": "#ffffff",
              "tertiary": "#006e2f",
              "on-error-container": "#93000a",
              "background": "#f8f9ff",
              "on-primary-container": "#004965"
            },
            fontFamily: {
              "headline": ["Plus Jakarta Sans"],
              "body": ["Inter"],
              "label": ["Inter"]
            },
            borderRadius: {"DEFAULT": "0.25rem", "lg": "0.5rem", "xl": "0.75rem", "full": "9999px"},
          },
        },
      }
    </script>
<style>
      body { font-family: 'Inter', sans-serif; }
      .font-headline { font-family: 'Plus Jakarta Sans', sans-serif; }
      .font-mono-data { font-family: 'Berkeley Mono', monospace; }
      .material-symbols-outlined {
        font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
      }
    </style>
</head>
<body class="bg-background text-on-background min-h-screen flex">
<!-- SideNavBar Component -->
<aside class="fixed left-0 top-0 h-full w-[280px] bg-[#eff4ff] dark:bg-[#0b1c30] flex flex-col p-6 z-50 transition-all duration-200 ease-in-out">
<div class="mb-10">
<h1 class="font-['Plus_Jakarta_Sans'] font-extrabold text-[#00668a] dark:text-[#38bdf8] text-2xl tracking-tight">Civic Intelligence</h1>
<p class="text-[10px] font-bold tracking-[0.2em] text-[#3e484f] dark:text-[#bdc8d1] uppercase mt-1">Sovereign Clarity</p>
</div>
<nav class="flex-1 space-y-2">
<a class="flex items-center gap-3 px-4 py-3 text-[#3e484f] dark:text-[#bdc8d1] hover:bg-[#ffffff]/50 dark:hover:bg-[#ffffff]/5 rounded-lg transition-colors font-['Inter'] text-sm font-medium" href="#">
<span class="material-symbols-outlined" data-icon="dashboard">dashboard</span>
<span>Dashboard</span>
</a>
<a class="flex items-center gap-3 px-4 py-3 text-[#3e484f] dark:text-[#bdc8d1] hover:bg-[#ffffff]/50 dark:hover:bg-[#ffffff]/5 rounded-lg transition-colors font-['Inter'] text-sm font-medium" href="#">
<span class="material-symbols-outlined" data-icon="assignment_late">assignment_late</span>
<span>My Complaints</span>
</a>
<a class="flex items-center gap-3 px-4 py-3 text-[#3e484f] dark:text-[#bdc8d1] hover:bg-[#ffffff]/50 dark:hover:bg-[#ffffff]/5 rounded-lg transition-colors font-['Inter'] text-sm font-medium" href="#">
<span class="material-symbols-outlined" data-icon="campaign">campaign</span>
<span>Report Issue</span>
</a>
<!-- ACTIVE: Notifications -->
<a class="flex items-center gap-3 px-4 py-3 bg-[#ffffff] dark:bg-[#38bdf8]/10 text-[#00668a] dark:text-[#38bdf8] rounded-lg shadow-sm font-['Inter'] text-sm font-medium" href="#">
<span class="material-symbols-outlined" data-icon="notifications">notifications</span>
<span>Notifications</span>
</a>
<a class="flex items-center gap-3 px-4 py-3 text-[#3e484f] dark:text-[#bdc8d1] hover:bg-[#ffffff]/50 dark:hover:bg-[#ffffff]/5 rounded-lg transition-colors font-['Inter'] text-sm font-medium" href="#">
<span class="material-symbols-outlined" data-icon="help">help</span>
<span>Help</span>
</a>
<a class="flex items-center gap-3 px-4 py-3 text-[#3e484f] dark:text-[#bdc8d1] hover:bg-[#ffffff]/50 dark:hover:bg-[#ffffff]/5 rounded-lg transition-colors font-['Inter'] text-sm font-medium" href="#">
<span class="material-symbols-outlined" data-icon="settings">settings</span>
<span>Settings</span>
</a>
</nav>
<div class="mt-auto pt-6 border-t border-[#bdc8d1]/20">
<button class="w-full bg-primary text-white py-3 rounded-lg font-bold text-sm shadow-md flex items-center justify-center gap-2 hover:bg-primary-container transition-colors">
<span class="material-symbols-outlined text-sm" data-icon="add">add</span>
                New Report
            </button>
<a class="flex items-center gap-3 px-4 py-3 mt-4 text-error dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors font-['Inter'] text-sm font-medium" href="#">
<span class="material-symbols-outlined" data-icon="logout">logout</span>
<span>Logout</span>
</a>
</div>
</aside>
<!-- Main Canvas -->
<main class="ml-[280px] w-[calc(100%-280px)] min-h-screen flex flex-col">
<!-- TopNavBar Component -->
<header class="fixed top-0 right-0 w-[calc(100%-280px)] h-16 bg-[#f8f9ff]/80 dark:bg-[#0b1c30]/80 backdrop-blur-md border-b border-[#bdc8d1]/15 flex justify-between items-center px-8 z-40">
<div class="flex items-center gap-4">
<span class="text-xl font-bold text-[#0b1c30] dark:text-[#f8f9ff] font-headline tracking-tight">Delhi Civic IQ</span>
</div>
<div class="flex items-center gap-6">
<div class="relative group">
<span class="material-symbols-outlined text-[#3e484f] dark:text-[#bdc8d1] cursor-pointer hover:text-primary transition-colors" data-icon="notifications">notifications</span>
</div>
<div class="flex items-center gap-3 cursor-pointer group">
<div class="text-right">
<p class="text-xs font-bold text-on-background">Rajesh Kumar</p>
<p class="text-[10px] text-on-surface-variant font-mono-data">ID: DL-8842</p>
</div>
<span class="material-symbols-outlined text-3xl text-primary" data-icon="account_circle">account_circle</span>
</div>
</div>
</header>
<!-- Page Content -->
<div class="mt-16 p-10 max-w-5xl mx-auto w-full">
<!-- Breadcrumb -->
<nav class="flex items-center gap-2 text-xs font-medium text-on-surface-variant mb-6">
<a class="hover:text-primary" href="#">Dashboard</a>
<span class="material-symbols-outlined text-[10px]" data-icon="chevron_right">chevron_right</span>
<span class="text-on-surface">Notifications</span>
</nav>
<!-- Header Section -->
<div class="flex justify-between items-end mb-8">
<div>
<h2 class="text-4xl font-extrabold font-headline tracking-tight text-on-surface mb-2">Notifications</h2>
<p class="text-on-surface-variant">Stay updated with your civic reports and area alerts.</p>
</div>
<a class="text-sm font-semibold text-primary hover:underline flex items-center gap-1" href="#">
<span class="material-symbols-outlined text-sm" data-icon="done_all">done_all</span>
                    Mark all as read
                </a>
</div>
<!-- Filters -->
<div class="flex items-center gap-3 mb-8">
<button class="px-5 py-2 rounded-full bg-primary text-white text-sm font-semibold shadow-sm">All</button>
<button class="px-5 py-2 rounded-full bg-surface-container-high text-on-surface text-sm font-medium hover:bg-surface-container-highest transition-colors">Unread</button>
<button class="px-5 py-2 rounded-full bg-surface-container-high text-on-surface text-sm font-medium hover:bg-surface-container-highest transition-colors">Complaints</button>
<button class="px-5 py-2 rounded-full bg-surface-container-high text-on-surface text-sm font-medium hover:bg-surface-container-highest transition-colors">Alerts</button>
<button class="px-5 py-2 rounded-full bg-surface-container-high text-on-surface text-sm font-medium hover:bg-surface-container-highest transition-colors">Surveys</button>
</div>
<!-- Notifications List Container -->
<div class="bg-surface-container-lowest rounded-xl shadow-[0_4px_20px_rgba(11,28,48,0.03)] border border-outline-variant/30 overflow-hidden">
<!-- Notification Row: UNREAD - Contractor Assignment -->
<div class="flex gap-6 p-6 bg-[#f8fafc] border-l-[3px] border-primary-container hover:bg-surface-container-low transition-colors group">
<div class="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
<span class="material-symbols-outlined text-primary" data-icon="engineering">engineering</span>
</div>
<div class="flex-1">
<div class="flex justify-between items-start mb-1">
<h4 class="font-bold text-on-surface">Contractor Assigned</h4>
<span class="text-[10px] font-mono-data text-on-surface-variant">2 MIN AGO</span>
</div>
<p class="text-sm text-on-surface-variant leading-relaxed mb-3">
                            A field engineer has been assigned to your complaint <span class="font-mono-data text-primary">#CIV-2024-082</span> regarding street lighting in Sector 4.
                        </p>
<div class="flex items-center gap-2">
<button class="text-xs font-bold text-primary hover:text-on-primary-container">View Profile</button>
</div>
</div>
</div>
<!-- Notification Row: UNREAD - Survey Request -->
<div class="flex gap-6 p-6 bg-[#f8fafc] border-l-[3px] border-primary-container hover:bg-surface-container-low transition-colors">
<div class="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
<span class="material-symbols-outlined text-tertiary" data-icon="rate_review">rate_review</span>
</div>
<div class="flex-1">
<div class="flex justify-between items-start mb-1">
<h4 class="font-bold text-on-surface">Service Feedback Request</h4>
<span class="text-[10px] font-mono-data text-on-surface-variant">45 MIN AGO</span>
</div>
<p class="text-sm text-on-surface-variant leading-relaxed mb-4">
                            Your recent pothole repair request was marked as resolved. Are you satisfied with the quality of the work?
                        </p>
<div class="flex items-center gap-3">
<button class="bg-primary text-white px-6 py-2 rounded-lg text-xs font-bold hover:bg-primary-container transition-colors">Yes, satisfied</button>
<button class="bg-surface-container-high text-on-surface px-6 py-2 rounded-lg text-xs font-bold hover:bg-surface-container-highest transition-colors">No, issues remain</button>
</div>
</div>
</div>
<!-- Notification Row: UNREAD - SLA Reminder -->
<div class="flex gap-6 p-6 bg-[#f8fafc] border-l-[3px] border-primary-container hover:bg-surface-container-low transition-colors">
<div class="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
<span class="material-symbols-outlined text-secondary" data-icon="schedule">schedule</span>
</div>
<div class="flex-1">
<div class="flex justify-between items-start mb-1">
<h4 class="font-bold text-on-surface">Timeline Update</h4>
<span class="text-[10px] font-mono-data text-on-surface-variant">2 HOURS AGO</span>
</div>
<p class="text-sm text-on-surface-variant leading-relaxed">
                            The estimated resolution time for <span class="font-mono-data text-primary">#CIV-2024-079</span> has been updated to Oct 14, 2023 due to heavy rainfall in the area.
                        </p>
</div>
</div>
<!-- Notification Row: READ - Area Alert -->
<div class="flex gap-6 p-6 hover:bg-surface-container-low transition-colors border-t border-outline-variant/10 opacity-75">
<div class="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
<span class="material-symbols-outlined text-error" data-icon="warning">warning</span>
</div>
<div class="flex-1">
<div class="flex justify-between items-start mb-1">
<h4 class="font-semibold text-on-surface">Scheduled Power Maintenance</h4>
<span class="text-[10px] font-mono-data text-on-surface-variant uppercase">Yesterday</span>
</div>
<p class="text-sm text-on-surface-variant leading-relaxed">
                            Grid maintenance scheduled for Dwarka Sector 10 from 10:00 AM to 02:00 PM today. Please plan accordingly.
                        </p>
</div>
</div>
<!-- Notification Row: READ - Resolved Complaint -->
<div class="flex gap-6 p-6 hover:bg-surface-container-low transition-colors border-t border-outline-variant/10 opacity-75">
<div class="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center flex-shrink-0">
<span class="material-symbols-outlined text-tertiary" data-icon="task_alt">task_alt</span>
</div>
<div class="flex-1">
<div class="flex justify-between items-start mb-1">
<h4 class="font-semibold text-on-surface">Case Resolved: #CIV-2024-041</h4>
<span class="text-[10px] font-mono-data text-on-surface-variant uppercase">Oct 10</span>
</div>
<p class="text-sm text-on-surface-variant leading-relaxed">
                            Garbage collection issue in your vicinity has been addressed. The site has been cleared and sanitized.
                        </p>
</div>
</div>
<!-- Notification Row: READ - Submission Confirmed -->
<div class="flex gap-6 p-6 hover:bg-surface-container-low transition-colors border-t border-outline-variant/10 opacity-75">
<div class="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center flex-shrink-0">
<span class="material-symbols-outlined text-primary" data-icon="send">send</span>
</div>
<div class="flex-1">
<div class="flex justify-between items-start mb-1">
<h4 class="font-semibold text-on-surface">Submission Received</h4>
<span class="text-[10px] font-mono-data text-on-surface-variant uppercase">Oct 09</span>
</div>
<p class="text-sm text-on-surface-variant leading-relaxed">
                            We have received your report regarding "Broken Water Main". It is currently being validated by our zonal office.
                        </p>
</div>
</div>
</div>
<!-- Bottom State -->
<div class="mt-12 text-center py-6">
<div class="inline-flex items-center gap-3 text-on-surface-variant/60 font-medium">
<span class="material-symbols-outlined text-lg" data-icon="check_circle">check_circle</span>
<span class="text-sm">You're all caught up ✓</span>
</div>
<div class="mt-2">
<button class="text-xs font-bold text-primary hover:underline">View older notifications</button>
</div>
</div>
</div>
</main>
<!-- Contextual FAB (Suppressed on this screen as per instructions) -->
</body></html>

<!-- My Complaints - PS-CRM Delhi -->
<!DOCTYPE html>

<html class="light" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>My Complaints - Delhi Civic IQ</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&amp;family=Inter:wght@400;500;600&amp;family=JetBrains+Mono&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
    tailwind.config = {
      darkMode: "class",
      theme: {
        extend: {
          colors: {
            "primary-container": "#38bdf8",
            "on-surface": "#0b1c30",
            "on-background": "#0b1c30",
            "tertiary-container": "#2ccb63",
            "surface-dim": "#cbdbf5",
            "surface-container-highest": "#d3e4fe",
            "on-tertiary-container": "#004f20",
            "surface-container-high": "#dce9ff",
            "on-secondary-fixed": "#2a1700",
            "error": "#ba1a1a",
            "on-secondary-fixed-variant": "#653e00",
            "surface-bright": "#f8f9ff",
            "inverse-surface": "#213145",
            "error-container": "#ffdad6",
            "surface-variant": "#d3e4fe",
            "on-secondary-container": "#684000",
            "on-primary-fixed": "#001e2c",
            "on-primary-fixed-variant": "#004c69",
            "on-secondary": "#ffffff",
            "outline-variant": "#bdc8d1",
            "on-tertiary-fixed": "#002109",
            "surface-container-low": "#eff4ff",
            "inverse-primary": "#7bd0ff",
            "inverse-on-surface": "#eaf1ff",
            "secondary-fixed": "#ffddb8",
            "secondary-fixed-dim": "#ffb95f",
            "secondary": "#855300",
            "primary": "#00668a",
            "on-tertiary-fixed-variant": "#005321",
            "tertiary-fixed-dim": "#4ae176",
            "surface-tint": "#00668a",
            "on-primary": "#ffffff",
            "surface-container-lowest": "#ffffff",
            "outline": "#6e7980",
            "on-surface-variant": "#3e484f",
            "tertiary-fixed": "#6bff8f",
            "surface-container": "#e5eeff",
            "surface": "#f8f9ff",
            "primary-fixed-dim": "#7bd0ff",
            "secondary-container": "#fea619",
            "primary-fixed": "#c4e7ff",
            "on-tertiary": "#ffffff",
            "on-error": "#ffffff",
            "tertiary": "#006e2f",
            "on-error-container": "#93000a",
            "background": "#f8f9ff",
            "on-primary-container": "#004965"
          },
          fontFamily: {
            "headline": ["Plus Jakarta Sans"],
            "body": ["Inter"],
            "label": ["Inter"],
            "mono": ["JetBrains Mono"]
          },
          borderRadius: {"DEFAULT": "0.25rem", "lg": "0.5rem", "xl": "0.75rem", "full": "9999px"},
        },
      },
    }
  </script>
<style>
    body { font-family: 'Inter', sans-serif; }
    .headline-font { font-family: 'Plus Jakarta Sans', sans-serif; }
    .mono-font { font-family: 'JetBrains Mono', monospace; }
    .material-symbols-outlined {
      font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
    }
  </style>
</head>
<body class="bg-background text-on-background min-h-screen">
<!-- SideNavBar -->
<aside class="fixed left-0 top-0 h-full w-[280px] bg-[#eff4ff] dark:bg-[#0b1c30] flex flex-col p-6 z-50">
<div class="mb-10">
<h1 class="font-['Plus_Jakarta_Sans'] font-extrabold text-[#00668a] dark:text-[#38bdf8] text-2xl tracking-tight">Civic Intelligence</h1>
<p class="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-bold mt-1">Sovereign Clarity</p>
</div>
<nav class="flex-1 space-y-2">
<a class="flex items-center gap-3 px-4 py-3 text-[#3e484f] dark:text-[#bdc8d1] font-medium text-sm hover:bg-[#ffffff]/50 dark:hover:bg-[#ffffff]/5 transition-all duration-200 ease-in-out" href="#">
<span class="material-symbols-outlined" data-icon="dashboard">dashboard</span>
        Dashboard
      </a>
<!-- Active Tab: My Complaints -->
<a class="flex items-center gap-3 px-4 py-3 bg-[#ffffff] dark:bg-[#38bdf8]/10 text-[#00668a] dark:text-[#38bdf8] rounded-lg shadow-sm font-medium text-sm transition-all duration-200 ease-in-out" href="#">
<span class="material-symbols-outlined" data-icon="assignment_late">assignment_late</span>
        My Complaints
      </a>
<a class="flex items-center gap-3 px-4 py-3 text-[#3e484f] dark:text-[#bdc8d1] font-medium text-sm hover:bg-[#ffffff]/50 dark:hover:bg-[#ffffff]/5 transition-all duration-200 ease-in-out" href="#">
<span class="material-symbols-outlined" data-icon="campaign">campaign</span>
        Report Issue
      </a>
<a class="flex items-center gap-3 px-4 py-3 text-[#3e484f] dark:text-[#bdc8d1] font-medium text-sm hover:bg-[#ffffff]/50 dark:hover:bg-[#ffffff]/5 transition-all duration-200 ease-in-out" href="#">
<span class="material-symbols-outlined" data-icon="notifications">notifications</span>
        Notifications
      </a>
<a class="flex items-center gap-3 px-4 py-3 text-[#3e484f] dark:text-[#bdc8d1] font-medium text-sm hover:bg-[#ffffff]/50 dark:hover:bg-[#ffffff]/5 transition-all duration-200 ease-in-out" href="#">
<span class="material-symbols-outlined" data-icon="help">help</span>
        Help
      </a>
<a class="flex items-center gap-3 px-4 py-3 text-[#3e484f] dark:text-[#bdc8d1] font-medium text-sm hover:bg-[#ffffff]/50 dark:hover:bg-[#ffffff]/5 transition-all duration-200 ease-in-out" href="#">
<span class="material-symbols-outlined" data-icon="settings">settings</span>
        Settings
      </a>
</nav>
<div class="mt-auto pt-6 border-t border-outline-variant/10">
<button class="w-full flex items-center justify-center gap-2 bg-primary text-on-primary py-3 rounded-lg font-semibold text-sm hover:bg-primary-container transition-colors shadow-md">
<span class="material-symbols-outlined text-[20px]" data-icon="add">add</span>
        New Report
      </button>
<a class="flex items-center gap-3 px-4 py-3 mt-4 text-[#3e484f] dark:text-[#bdc8d1] font-medium text-sm hover:bg-[#ffffff]/50 transition-all" href="#">
<span class="material-symbols-outlined" data-icon="logout">logout</span>
        Logout
      </a>
</div>
</aside>
<!-- Main Content Wrapper -->
<div class="ml-[280px] min-h-screen flex flex-col">
<!-- TopNavBar -->
<header class="fixed top-0 right-0 w-[calc(100%-280px)] h-16 bg-[#f8f9ff]/80 dark:bg-[#0b1c30]/80 backdrop-blur-md flex justify-between items-center px-8 z-40 border-b border-[#bdc8d1]/15 shadow-sm dark:shadow-none">
<div class="flex items-center gap-4">
<span class="text-xl font-bold text-[#0b1c30] dark:text-[#f8f9ff] headline-font">Delhi Civic IQ</span>
</div>
<div class="flex items-center gap-6">
<div class="relative">
<span class="material-symbols-outlined text-on-surface-variant cursor-pointer hover:text-primary transition-colors" data-icon="notifications">notifications</span>
<span class="absolute -top-1 -right-1 w-2 h-2 bg-error rounded-full"></span>
</div>
<div class="flex items-center gap-3 pl-6 border-l border-outline-variant/20">
<div class="text-right hidden sm:block">
<p class="text-xs font-bold text-on-surface">Arjun Mehra</p>
<p class="text-[10px] text-on-surface-variant">Ward 42, NDMC</p>
</div>
<span class="material-symbols-outlined text-3xl text-primary" data-icon="account_circle" style="font-variation-settings: 'FILL' 1;">account_circle</span>
</div>
</div>
</header>
<!-- Canvas -->
<main class="mt-16 p-8 flex-1">
<!-- Breadcrumbs -->
<nav class="flex items-center gap-2 text-xs font-medium text-on-surface-variant mb-6">
<a class="hover:text-primary transition-colors" href="#">Dashboard</a>
<span class="material-symbols-outlined text-[14px]" data-icon="chevron_right">chevron_right</span>
<span class="text-on-surface">My Complaints</span>
</nav>
<!-- Page Header -->
<div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
<div>
<h2 class="text-3xl font-extrabold headline-font text-on-surface tracking-tight flex items-center gap-3">
            My Complaints
            <span class="bg-primary-container/20 text-primary text-xs px-2.5 py-1 rounded-full font-bold">6 Total</span>
</h2>
<p class="text-on-surface-variant mt-1 max-w-lg">Track and manage your submitted civic reports. Transparency is the bedrock of sovereign governance.</p>
</div>
<button class="bg-primary text-on-primary px-6 py-3 rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg shadow-primary/20 hover:bg-on-primary-container transition-all active:scale-95">
<span class="material-symbols-outlined text-[20px]" data-icon="add_circle">add_circle</span>
          + Submit New Complaint
        </button>
</div>
<!-- Filters & Search -->
<div class="bg-surface-container-low p-4 rounded-xl flex flex-wrap items-center gap-4 mb-6">
<div class="flex-1 min-w-[240px] relative">
<span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]" data-icon="search">search</span>
<input class="w-full bg-surface-container-lowest border-none ring-1 ring-outline-variant/30 focus:ring-2 focus:ring-primary rounded-lg pl-10 pr-4 py-2 text-sm transition-all" placeholder="Search by ID or description..." type="text"/>
</div>
<div class="flex items-center gap-3 overflow-x-auto">
<select class="bg-surface-container-lowest border-none ring-1 ring-outline-variant/30 text-xs font-semibold rounded-lg py-2 pl-3 pr-8 focus:ring-2 focus:ring-primary cursor-pointer">
<option>Status: All</option>
<option>Pending</option>
<option>In Progress</option>
<option>Resolved</option>
</select>
<select class="bg-surface-container-lowest border-none ring-1 ring-outline-variant/30 text-xs font-semibold rounded-lg py-2 pl-3 pr-8 focus:ring-2 focus:ring-primary cursor-pointer">
<option>Category: All</option>
<option>Sanitation</option>
<option>Infrastructure</option>
<option>Water</option>
</select>
<select class="bg-surface-container-lowest border-none ring-1 ring-outline-variant/30 text-xs font-semibold rounded-lg py-2 pl-3 pr-8 focus:ring-2 focus:ring-primary cursor-pointer">
<option>Date: This Month</option>
<option>Last 3 Months</option>
<option>2023</option>
</select>
<button class="flex items-center gap-2 px-4 py-2 bg-surface-container-high text-on-surface text-xs font-bold rounded-lg hover:bg-surface-container-highest transition-colors">
<span class="material-symbols-outlined text-[16px]" data-icon="sort">sort</span>
            Sort
          </button>
</div>
</div>
<!-- Complaints Table Container -->
<div class="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm border border-outline-variant/10">
<table class="w-full text-left border-collapse">
<thead>
<tr class="bg-surface-container-low border-b border-outline-variant/20">
<th class="px-6 py-4 text-[10px] font-extrabold uppercase tracking-widest text-on-surface-variant">ID</th>
<th class="px-6 py-4 text-[10px] font-extrabold uppercase tracking-widest text-on-surface-variant">Category</th>
<th class="px-6 py-4 text-[10px] font-extrabold uppercase tracking-widest text-on-surface-variant">Location</th>
<th class="px-6 py-4 text-[10px] font-extrabold uppercase tracking-widest text-on-surface-variant">Filed On</th>
<th class="px-6 py-4 text-[10px] font-extrabold uppercase tracking-widest text-on-surface-variant">Status</th>
<th class="px-6 py-4 text-[10px] font-extrabold uppercase tracking-widest text-on-surface-variant">Progress</th>
<th class="px-6 py-4 text-[10px] font-extrabold uppercase tracking-widest text-on-surface-variant text-right">Action</th>
</tr>
</thead>
<tbody class="divide-y divide-surface">
<!-- Row 1 -->
<tr class="hover:bg-surface-container-low/30 transition-colors group">
<td class="px-6 py-5 text-xs font-bold text-primary mono-font">#CIV-9821</td>
<td class="px-6 py-5">
<div class="flex items-center gap-2">
<span class="material-symbols-outlined text-primary text-[18px]" data-icon="water_drop">water_drop</span>
<span class="text-sm font-semibold text-on-surface">Water Leakage</span>
</div>
</td>
<td class="px-6 py-5">
<p class="text-sm text-on-surface-variant">Vasant Kunj, Sector B</p>
</td>
<td class="px-6 py-5 text-sm text-on-surface-variant">Oct 24, 2023</td>
<td class="px-6 py-5">
<span class="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-tertiary-container text-on-tertiary-fixed-variant">Resolved</span>
</td>
<td class="px-6 py-5">
<div class="flex gap-1">
<span class="w-2 h-2 rounded-full bg-tertiary"></span>
<span class="w-2 h-2 rounded-full bg-tertiary"></span>
<span class="w-2 h-2 rounded-full bg-tertiary"></span>
<span class="w-2 h-2 rounded-full bg-tertiary"></span>
</div>
</td>
<td class="px-6 py-5 text-right">
<a class="text-primary text-xs font-bold hover:underline" href="#">View link</a>
</td>
</tr>
<!-- Row 2 -->
<tr class="hover:bg-surface-container-low/30 transition-colors group">
<td class="px-6 py-5 text-xs font-bold text-primary mono-font">#CIV-9904</td>
<td class="px-6 py-5">
<div class="flex items-center gap-2">
<span class="material-symbols-outlined text-primary text-[18px]" data-icon="lightbulb">lightbulb</span>
<span class="text-sm font-semibold text-on-surface">Street Light Out</span>
</div>
</td>
<td class="px-6 py-5">
<p class="text-sm text-on-surface-variant">Hauz Khas Village</p>
</td>
<td class="px-6 py-5 text-sm text-on-surface-variant">Nov 02, 2023</td>
<td class="px-6 py-5">
<span class="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary-container/20 text-on-primary-container">In Progress</span>
</td>
<td class="px-6 py-5">
<div class="flex gap-1">
<span class="w-2 h-2 rounded-full bg-primary"></span>
<span class="w-2 h-2 rounded-full bg-primary"></span>
<span class="w-2 h-2 rounded-full bg-outline-variant/30"></span>
<span class="w-2 h-2 rounded-full bg-outline-variant/30"></span>
</div>
</td>
<td class="px-6 py-5 text-right">
<a class="text-primary text-xs font-bold hover:underline" href="#">View link</a>
</td>
</tr>
<!-- Row 3 -->
<tr class="hover:bg-surface-container-low/30 transition-colors group">
<td class="px-6 py-5 text-xs font-bold text-primary mono-font">#CIV-9942</td>
<td class="px-6 py-5">
<div class="flex items-center gap-2">
<span class="material-symbols-outlined text-primary text-[18px]" data-icon="delete">delete</span>
<span class="text-sm font-semibold text-on-surface">Garbage Overflow</span>
</div>
</td>
<td class="px-6 py-5">
<p class="text-sm text-on-surface-variant">Karol Bagh Market</p>
</td>
<td class="px-6 py-5 text-sm text-on-surface-variant">Nov 05, 2023</td>
<td class="px-6 py-5">
<span class="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-surface-variant text-on-surface-variant">Pending</span>
</td>
<td class="px-6 py-5">
<div class="flex gap-1">
<span class="w-2 h-2 rounded-full bg-primary"></span>
<span class="w-2 h-2 rounded-full bg-outline-variant/30"></span>
<span class="w-2 h-2 rounded-full bg-outline-variant/30"></span>
<span class="w-2 h-2 rounded-full bg-outline-variant/30"></span>
</div>
</td>
<td class="px-6 py-5 text-right">
<a class="text-primary text-xs font-bold hover:underline" href="#">View link</a>
</td>
</tr>
<!-- Row 4 -->
<tr class="hover:bg-surface-container-low/30 transition-colors group">
<td class="px-6 py-5 text-xs font-bold text-primary mono-font">#CIV-8722</td>
<td class="px-6 py-5">
<div class="flex items-center gap-2">
<span class="material-symbols-outlined text-primary text-[18px]" data-icon="handyman">handyman</span>
<span class="text-sm font-semibold text-on-surface">Pothole Repair</span>
</div>
</td>
<td class="px-6 py-5">
<p class="text-sm text-on-surface-variant">Greater Kailash II</p>
</td>
<td class="px-6 py-5 text-sm text-on-surface-variant">Sep 15, 2023</td>
<td class="px-6 py-5">
<span class="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-error-container text-on-error-container">Escalated</span>
</td>
<td class="px-6 py-5">
<div class="flex gap-1">
<span class="w-2 h-2 rounded-full bg-error"></span>
<span class="w-2 h-2 rounded-full bg-error"></span>
<span class="w-2 h-2 rounded-full bg-error"></span>
<span class="w-2 h-2 rounded-full bg-outline-variant/30"></span>
</div>
</td>
<td class="px-6 py-5 text-right">
<a class="text-primary text-xs font-bold hover:underline" href="#">View link</a>
</td>
</tr>
<!-- Row 5 -->
<tr class="hover:bg-surface-container-low/30 transition-colors group">
<td class="px-6 py-5 text-xs font-bold text-primary mono-font">#CIV-9211</td>
<td class="px-6 py-5">
<div class="flex items-center gap-2">
<span class="material-symbols-outlined text-primary text-[18px]" data-icon="park">park</span>
<span class="text-sm font-semibold text-on-surface">Park Maintenance</span>
</div>
</td>
<td class="px-6 py-5">
<p class="text-sm text-on-surface-variant">Lodhi Gardens Area</p>
</td>
<td class="px-6 py-5 text-sm text-on-surface-variant">Oct 01, 2023</td>
<td class="px-6 py-5">
<span class="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-tertiary-container text-on-tertiary-fixed-variant">Resolved</span>
</td>
<td class="px-6 py-5">
<div class="flex gap-1">
<span class="w-2 h-2 rounded-full bg-tertiary"></span>
<span class="w-2 h-2 rounded-full bg-tertiary"></span>
<span class="w-2 h-2 rounded-full bg-tertiary"></span>
<span class="w-2 h-2 rounded-full bg-tertiary"></span>
</div>
</td>
<td class="px-6 py-5 text-right">
<a class="text-primary text-xs font-bold hover:underline" href="#">View link</a>
</td>
</tr>
<!-- Row 6 -->
<tr class="hover:bg-surface-container-low/30 transition-colors group">
<td class="px-6 py-5 text-xs font-bold text-primary mono-font">#CIV-9501</td>
<td class="px-6 py-5">
<div class="flex items-center gap-2">
<span class="material-symbols-outlined text-primary text-[18px]" data-icon="warning">warning</span>
<span class="text-sm font-semibold text-on-surface">Illegal Construction</span>
</div>
</td>
<td class="px-6 py-5">
<p class="text-sm text-on-surface-variant">South Extension I</p>
</td>
<td class="px-6 py-5 text-sm text-on-surface-variant">Oct 12, 2023</td>
<td class="px-6 py-5">
<span class="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary-container/20 text-on-primary-container">In Progress</span>
</td>
<td class="px-6 py-5">
<div class="flex gap-1">
<span class="w-2 h-2 rounded-full bg-primary"></span>
<span class="w-2 h-2 rounded-full bg-primary"></span>
<span class="w-2 h-2 rounded-full bg-primary"></span>
<span class="w-2 h-2 rounded-full bg-outline-variant/30"></span>
</div>
</td>
<td class="px-6 py-5 text-right">
<a class="text-primary text-xs font-bold hover:underline" href="#">View link</a>
</td>
</tr>
</tbody>
</table>
<!-- Table Footer / Pagination -->
<div class="px-6 py-4 flex items-center justify-between border-t border-outline-variant/15 bg-surface">
<p class="text-xs text-on-surface-variant font-medium">Showing 6 of 6 complaints</p>
<div class="flex items-center gap-2">
<button class="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high disabled:opacity-30" disabled="">
<span class="material-symbols-outlined text-[18px]" data-icon="chevron_left">chevron_left</span>
</button>
<button class="w-8 h-8 flex items-center justify-center rounded-lg bg-primary text-on-primary text-xs font-bold">1</button>
<button class="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high">
<span class="material-symbols-outlined text-[18px]" data-icon="chevron_right">chevron_right</span>
</button>
</div>
</div>
</div>
</main>
<!-- Contextual FAB - Restricted (Suppressed as per rules for List/Details screens, but let's maintain UI continuity if needed) -->
<!-- Rule says: suppress FAB on Settings, Profile, Details, and Transactional. List is okay but usually hidden to focus on content. -->
</div>
</body></html>

<!-- My Profile - PS-CRM Delhi -->
<!DOCTYPE html>

<html class="light" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Profile — Delhi Civic IQ</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&amp;family=Inter:wght@400;500;600&amp;family=JetBrains+Mono&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            colors: {
              "primary-container": "#38bdf8",
              "on-surface": "#0b1c30",
              "on-background": "#0b1c30",
              "tertiary-container": "#2ccb63",
              "surface-dim": "#cbdbf5",
              "surface-container-highest": "#d3e4fe",
              "on-tertiary-container": "#004f20",
              "surface-container-high": "#dce9ff",
              "on-secondary-fixed": "#2a1700",
              "error": "#ba1a1a",
              "on-secondary-fixed-variant": "#653e00",
              "surface-bright": "#f8f9ff",
              "inverse-surface": "#213145",
              "error-container": "#ffdad6",
              "surface-variant": "#d3e4fe",
              "on-secondary-container": "#684000",
              "on-primary-fixed": "#001e2c",
              "on-primary-fixed-variant": "#004c69",
              "on-secondary": "#ffffff",
              "outline-variant": "#bdc8d1",
              "on-tertiary-fixed": "#002109",
              "surface-container-low": "#eff4ff",
              "inverse-primary": "#7bd0ff",
              "inverse-on-surface": "#eaf1ff",
              "secondary-fixed": "#ffddb8",
              "secondary-fixed-dim": "#ffb95f",
              "secondary": "#855300",
              "primary": "#00668a",
              "on-tertiary-fixed-variant": "#005321",
              "tertiary-fixed-dim": "#4ae176",
              "surface-tint": "#00668a",
              "on-primary": "#ffffff",
              "surface-container-lowest": "#ffffff",
              "outline": "#6e7980",
              "on-surface-variant": "#3e484f",
              "tertiary-fixed": "#6bff8f",
              "surface-container": "#e5eeff",
              "surface": "#f8f9ff",
              "primary-fixed-dim": "#7bd0ff",
              "secondary-container": "#fea619",
              "primary-fixed": "#c4e7ff",
              "on-tertiary": "#ffffff",
              "on-error": "#ffffff",
              "tertiary": "#006e2f",
              "on-error-container": "#93000a",
              "background": "#f8f9ff",
              "on-primary-container": "#004965"
            },
            fontFamily: {
              "headline": ["Plus Jakarta Sans"],
              "body": ["Inter"],
              "label": ["Inter"],
              "mono": ["JetBrains Mono"]
            },
            borderRadius: {"DEFAULT": "0.25rem", "lg": "0.5rem", "xl": "0.75rem", "full": "9999px"},
          },
        },
      }
    </script>
<style>
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        body { font-family: 'Inter', sans-serif; }
        h1, h2, h3 { font-family: 'Plus Jakarta Sans', sans-serif; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
    </style>
</head>
<body class="bg-background text-on-background selection:bg-primary-container selection:text-on-primary-container">
<!-- SideNavBar Shell -->
<aside class="fixed left-0 top-0 h-full w-[280px] bg-[#eff4ff] dark:bg-[#0b1c30] flex flex-col p-6 z-50 transition-all duration-200 ease-in-out">
<div class="mb-8 px-2">
<h1 class="font-['Plus_Jakarta_Sans'] font-extrabold text-[#00668a] dark:text-[#38bdf8] text-2xl tracking-tight">Civic Intelligence</h1>
<p class="text-on-surface-variant text-xs font-medium uppercase tracking-widest mt-1 opacity-70">Sovereign Clarity</p>
</div>
<nav class="flex-1 space-y-2">
<a class="flex items-center gap-3 px-4 py-3 text-[#3e484f] dark:text-[#bdc8d1] font-['Inter'] text-sm font-medium hover:bg-[#ffffff]/50 dark:hover:bg-[#ffffff]/5 rounded-lg transition-colors" href="#">
<span class="material-symbols-outlined">dashboard</span>
<span>Dashboard</span>
</a>
<a class="flex items-center gap-3 px-4 py-3 text-[#3e484f] dark:text-[#bdc8d1] font-['Inter'] text-sm font-medium hover:bg-[#ffffff]/50 dark:hover:bg-[#ffffff]/5 rounded-lg transition-colors" href="#">
<span class="material-symbols-outlined">assignment_late</span>
<span>My Complaints</span>
</a>
<a class="flex items-center gap-3 px-4 py-3 text-[#3e484f] dark:text-[#bdc8d1] font-['Inter'] text-sm font-medium hover:bg-[#ffffff]/50 dark:hover:bg-[#ffffff]/5 rounded-lg transition-colors" href="#">
<span class="material-symbols-outlined">campaign</span>
<span>Report Issue</span>
</a>
<a class="flex items-center gap-3 px-4 py-3 text-[#3e484f] dark:text-[#bdc8d1] font-['Inter'] text-sm font-medium hover:bg-[#ffffff]/50 dark:hover:bg-[#ffffff]/5 rounded-lg transition-colors" href="#">
<span class="material-symbols-outlined">notifications</span>
<span>Notifications</span>
</a>
<a class="flex items-center gap-3 px-4 py-3 text-[#3e484f] dark:text-[#bdc8d1] font-['Inter'] text-sm font-medium hover:bg-[#ffffff]/50 dark:hover:bg-[#ffffff]/5 rounded-lg transition-colors" href="#">
<span class="material-symbols-outlined">help</span>
<span>Help</span>
</a>
<a class="flex items-center gap-3 px-4 py-3 text-[#3e484f] dark:text-[#bdc8d1] font-['Inter'] text-sm font-medium hover:bg-[#ffffff]/50 dark:hover:bg-[#ffffff]/5 rounded-lg transition-colors" href="#">
<span class="material-symbols-outlined">settings</span>
<span>Settings</span>
</a>
</nav>
<div class="mt-auto space-y-4">
<button class="w-full bg-primary text-on-primary py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:bg-primary-container hover:text-on-primary-container transition-all active:scale-95">
<span class="material-symbols-outlined text-lg">add_circle</span>
                New Report
            </button>
<div class="pt-4 border-t border-outline-variant/20">
<a class="flex items-center gap-3 px-4 py-3 text-[#3e484f] dark:text-[#bdc8d1] font-['Inter'] text-sm font-medium hover:bg-[#ffffff]/50 rounded-lg transition-colors" href="#">
<span class="material-symbols-outlined">logout</span>
<span>Logout</span>
</a>
</div>
</div>
</aside>
<!-- TopNavBar Shell -->
<header class="fixed top-0 right-0 w-[calc(100%-280px)] h-16 bg-[#f8f9ff]/80 dark:bg-[#0b1c30]/80 backdrop-blur-md flex justify-between items-center px-8 z-40 border-b border-[#bdc8d1]/15">
<div class="flex items-center gap-2">
<span class="text-on-surface-variant text-sm font-medium">Dashboard</span>
<span class="material-symbols-outlined text-sm text-outline-variant">chevron_right</span>
<span class="text-primary font-semibold text-sm">Profile</span>
</div>
<div class="flex items-center gap-4">
<button class="p-2 text-[#3e484f] hover:bg-[#eff4ff] rounded-full transition-colors active:scale-95">
<span class="material-symbols-outlined">notifications</span>
</button>
<button class="flex items-center gap-3 p-1 pl-3 bg-surface-container-low rounded-full hover:bg-surface-container transition-colors group">
<span class="text-sm font-semibold text-on-surface">Rahul Kumar</span>
<div class="w-8 h-8 rounded-full bg-primary-container overflow-hidden">
<img class="w-full h-full object-cover" data-alt="User profile avatar portrait" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCRY_VQJtvK1PyIHmueMrBo3yZJHfTQqSw7M42EdtsKZO-fq6ML22k4ZkT-bcHhlOZ4FMpoqxtcqdTPgsOpKP5KgmDfzIvAGdTtIBxhJPOj205w1wvE08oPJQjXhFbADG1N2PLcS5WfCQ2bVEjQt4KcWYcpP6f3svdCS31gfTIr5k9TFRL3eLB7sQ1t00MF4u8zKTMb3yi_YQ-gVDt7KSjVyZkZlqnuazuLjgvFS0w-WfwXYC8ko6JTq9B9bCtDCHsV8PMWhaqm8TJO"/>
</div>
</button>
</div>
</header>
<!-- Main Content Canvas -->
<main class="ml-[280px] pt-24 px-8 pb-12">
<header class="mb-8">
<h2 class="text-3xl font-extrabold text-on-surface tracking-tight">My Profile</h2>
<p class="text-on-surface-variant mt-1">Manage your civic identity and preferences</p>
</header>
<div class="grid grid-cols-12 gap-8">
<!-- Left Column: 38% equivalent (~4.5 columns) -->
<div class="col-span-12 lg:col-span-5 space-y-8">
<!-- Profile Card -->
<section class="bg-surface-container-lowest rounded-xl p-8 shadow-sm transition-all hover:shadow-md border border-outline-variant/10">
<div class="flex flex-col items-center text-center">
<div class="relative group">
<div class="w-32 h-32 rounded-full ring-4 ring-surface-container-low overflow-hidden bg-primary-container/20">
<img class="w-full h-full object-cover" data-alt="Large profile picture of Rahul Kumar" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBDSm74mMvaAPdcHFTdKONk1fdg6wN-r3E04Au43DXlH78NymZf6yHAjmhUTKU1JLecvszD5-o0WKN0hWxJKn10eZFTjE-Wqk6KRz-cQc5B0dVspUyDNEnb6sGz20_6fE-gFs98UhOeiFaPaCiQnzdtC5rh7eOWo2out0MCMptbpf0eXhqlhtPq5idLN9baRmjXgI6qtM0xBcVpfMqNgw_teuo4bRVkNeNHS_n9IgyhOglzQqog1n4RD5dzTil2XgoCXtpy-NocD-CQ"/>
</div>
<button class="absolute bottom-1 right-1 bg-primary text-on-primary p-2 rounded-full shadow-lg hover:bg-primary-container transition-colors active:scale-90">
<span class="material-symbols-outlined text-sm">photo_camera</span>
</button>
</div>
<h3 class="mt-6 text-2xl font-bold text-on-surface">Rahul Kumar</h3>
<div class="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-surface-container text-primary rounded-full text-xs font-bold uppercase tracking-wider">
<span class="material-symbols-outlined text-sm" style="font-variation-settings: 'FILL' 1;">verified</span>
                            Citizen
                        </div>
<p class="mt-4 text-on-surface-variant text-sm max-w-[240px]">Registered resident since May 2022. Active contributor to Ward 42.</p>
</div>
<div class="mt-10 grid grid-cols-2 gap-4">
<div class="bg-surface-container-low p-4 rounded-lg">
<p class="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Active Reports</p>
<p class="text-2xl font-black text-primary mt-1">04</p>
</div>
<div class="bg-surface-container-low p-4 rounded-lg">
<p class="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Resolved</p>
<p class="text-2xl font-black text-tertiary mt-1">28</p>
</div>
<div class="bg-surface-container-low p-4 rounded-lg">
<p class="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Community Rank</p>
<p class="text-2xl font-black text-secondary mt-1">#12</p>
</div>
<div class="bg-surface-container-low p-4 rounded-lg">
<p class="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Karma Points</p>
<p class="text-2xl font-black text-on-surface mt-1">840</p>
</div>
</div>
</section>
<!-- Danger Zone Card -->
<section class="bg-error-container/10 rounded-xl p-8 border border-error/10">
<h3 class="text-lg font-bold text-error flex items-center gap-2">
<span class="material-symbols-outlined">gpp_maybe</span>
                        Account Privacy
                    </h3>
<div class="mt-6 space-y-4">
<button class="w-full flex items-center justify-between p-4 bg-surface-container-lowest hover:bg-surface-container transition-colors rounded-lg text-sm font-semibold text-on-surface border border-outline-variant/10">
<span class="flex items-center gap-3">
<span class="material-symbols-outlined text-primary">download</span>
                                Download My Data
                            </span>
<span class="material-symbols-outlined text-outline-variant">chevron_right</span>
</button>
<button class="w-full flex items-center justify-between p-4 bg-error/5 hover:bg-error/10 transition-colors rounded-lg text-sm font-semibold text-error border border-error/10">
<span class="flex items-center gap-3">
<span class="material-symbols-outlined">delete_forever</span>
                                Delete Account
                            </span>
<span class="material-symbols-outlined opacity-50">chevron_right</span>
</button>
</div>
</section>
</div>
<!-- Right Column: 60% equivalent (~7.5 columns) -->
<div class="col-span-12 lg:col-span-7 space-y-8">
<!-- Personal Info Form -->
<section class="bg-surface-container-lowest rounded-xl p-8 shadow-sm border border-outline-variant/10">
<div class="flex items-center justify-between mb-8">
<h3 class="text-xl font-bold text-on-surface">Personal Information</h3>
<span class="text-xs font-mono text-outline-variant uppercase tracking-widest">ID: IQ-882194</span>
</div>
<div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
<div class="space-y-1.5">
<label class="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Full Name</label>
<input class="w-full border-0 border-b border-outline-variant/30 focus:border-primary focus:ring-0 bg-transparent py-2 text-on-surface font-medium transition-all" type="text" value="Rahul Kumar"/>
</div>
<div class="space-y-1.5">
<label class="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Phone Number</label>
<input class="w-full border-0 border-b border-outline-variant/30 focus:border-primary focus:ring-0 bg-transparent py-2 text-on-surface font-medium transition-all" type="tel" value="+91 98765 43210"/>
</div>
<div class="space-y-1.5">
<label class="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Assigned Ward</label>
<select class="w-full border-0 border-b border-outline-variant/30 focus:border-primary focus:ring-0 bg-transparent py-2 text-on-surface font-medium transition-all appearance-none">
<option>Ward 42 - South Delhi</option>
<option>Ward 43 - South Delhi</option>
<option>Ward 12 - North Delhi</option>
</select>
</div>
<div class="space-y-1.5">
<label class="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Preferred Language</label>
<select class="w-full border-0 border-b border-outline-variant/30 focus:border-primary focus:ring-0 bg-transparent py-2 text-on-surface font-medium transition-all appearance-none">
<option>English (India)</option>
<option>Hindi (हिन्दी)</option>
<option>Punjabi (ਪੰਜਾਬੀ)</option>
</select>
</div>
</div>
<div class="mt-10 flex justify-end">
<button class="px-8 py-3 bg-primary text-on-primary rounded-lg font-bold hover:bg-primary-container hover:text-on-primary-container transition-all shadow-md active:scale-95">
                            Save Changes
                        </button>
</div>
</section>
<!-- Notification Preferences -->
<section class="bg-surface-container-lowest rounded-xl p-8 shadow-sm border border-outline-variant/10">
<h3 class="text-xl font-bold text-on-surface mb-8">Notification Preferences</h3>
<div class="space-y-6">
<div class="flex items-center justify-between group">
<div class="space-y-1">
<h4 class="text-sm font-bold text-on-surface">Complaint Status Updates</h4>
<p class="text-xs text-on-surface-variant">Real-time alerts when your report moves through the pipeline.</p>
</div>
<label class="relative inline-flex items-center cursor-pointer">
<input checked="" class="sr-only peer" type="checkbox"/>
<div class="w-11 h-6 bg-surface-container-high rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
</label>
</div>
<div class="flex items-center justify-between group">
<div class="space-y-1">
<h4 class="text-sm font-bold text-on-surface">SLA Reminders</h4>
<p class="text-xs text-on-surface-variant">Get notified when a resolution deadline is approaching.</p>
</div>
<label class="relative inline-flex items-center cursor-pointer">
<input checked="" class="sr-only peer" type="checkbox"/>
<div class="w-11 h-6 bg-surface-container-high rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
</label>
</div>
<div class="flex items-center justify-between group">
<div class="space-y-1">
<h4 class="text-sm font-bold text-on-surface">Area Security &amp; Utility Alerts</h4>
<p class="text-xs text-on-surface-variant">Maintenance schedules and emergency alerts for Ward 42.</p>
</div>
<label class="relative inline-flex items-center cursor-pointer">
<input class="sr-only peer" type="checkbox"/>
<div class="w-11 h-6 bg-surface-container-high rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
</label>
</div>
<div class="flex items-center justify-between group">
<div class="space-y-1">
<h4 class="text-sm font-bold text-on-surface">Community Intelligence Brief</h4>
<p class="text-xs text-on-surface-variant">Weekly digest of city-wide impact and key resolutions.</p>
</div>
<label class="relative inline-flex items-center cursor-pointer">
<input checked="" class="sr-only peer" type="checkbox"/>
<div class="w-11 h-6 bg-surface-container-high rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
</label>
</div>
</div>
</section>
</div>
</div>
</main>
</body></html>