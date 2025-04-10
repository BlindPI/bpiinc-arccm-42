
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Assured Response CCM - Authentication</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css">
  <style>
    :root {
      --primary: #e63946;
      --primary-dark: #d62c3a;
      --secondary: #1d3557;
      --secondary-light: #457b9d;
      --light: #f1faee;
      --accent: #a8dadc;
    }
    
    body {
      font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
      background-color: #f8fafc;
    }
    
    .brand-primary {
      background-color: var(--primary);
    }
    
    .brand-primary-text {
      color: var(--primary);
    }
    
    .brand-secondary {
      background-color: var(--secondary);
    }
    
    .brand-secondary-text {
      color: var(--secondary);
    }
    
    .brand-accent {
      background-color: var(--accent);
    }
    
    .tab-active {
      background-color: white;
      color: var(--primary);
      border-bottom: 3px solid var(--primary);
    }
    
    .tab-inactive {
      color: #64748b;
    }
    
    .custom-shadow {
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    }
    
    .hero-gradient {
      background: linear-gradient(135deg, var(--secondary) 0%, var(--secondary-light) 100%);
    }
    
    .input-focus:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(230, 57, 70, 0.2);
    }
    
    .button-hover:hover {
      background-color: var(--primary-dark);
    }
    
    .feature-icon {
      background-color: rgba(230, 57, 70, 0.1);
      color: var(--primary);
    }
    
    .partner-logo {
      filter: grayscale(100%);
      opacity: 0.7;
      transition: all 0.3s ease;
    }
    
    .partner-logo:hover {
      filter: grayscale(0%);
      opacity: 1;
    }

    @media print {
      .print-full-width {
        width: 100% !important;
        max-width: 100% !important;
      }
    }
  </style>
</head>
<body class="min-h-screen">
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
  <script src="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/js/all.min.js"></script>
</body>
</html>
