/* =============================================================================
   CivicReport – i18n.js
   Lightweight, zero-dependency internationalization engine.

   Usage
   -----
   1. Add  data-i18n="key"           to any element whose textContent to translate.
   2. Add  data-i18n-ph="key"        to any <input>/<textarea> to translate placeholder.
   3. Add  data-i18n-title="key"     to any element to translate its title attribute.
   4. Add  data-i18n-aria="key"      to any element to translate aria-label.
   5. Call window.i18n.setLang(code) to switch language at runtime.
   6. Call window.i18n.t(key)        to get a translated string in JS code.

   RTL
   ---
   Urdu ('ur') sets  dir="rtl"  on <html>; all other languages set  dir="ltr".

   Fallback
   --------
   Missing keys fall back to English ('en') silently.
   ============================================================================= */

(function () {
  'use strict';

  /* ── Translation dictionaries ──────────────────────────────────────── */
  /* Keys are intentionally short and dot-namespaced.                     */

  const TRANSLATIONS = {

    /* ------------------------------------------------------------------ */
    en: {
      /* Nav */
      'nav.home':       'Home',
      'nav.report':     'Report',
      'nav.track':      'Track',
      'nav.admin':      'Admin',
      'nav.lang':       'Language',

      /* Index page */
      'home.title':     'Welcome to CivicReport',
      'home.subtitle':  'Report civic issues in your city. Fast, trackable, AI-powered.',
      'home.btn.report':'📝 Report an Issue',
      'home.btn.track': '🔍 Track a Report',
      'home.btn.admin': '🛠 Admin Dashboard',

      /* Report form */
      'report.page.title':   'Report a Civic Issue',
      'report.page.subtitle':'Describe the problem. We'll categorise and prioritise it automatically.',
      'report.desc.label':   'What's the issue?',
      'report.desc.ph':      'e.g. There\'s a large pothole on MG Road near Sector 7…',
      'report.desc.hint':    'Be specific — location, severity, how long it\'s been there.',
      'report.cat.label':    'Category',
      'report.cat.auto':     '🤖 Auto-detect',
      'report.cat.hint':     'Leave on Auto-detect to let AI classify your report.',
      'report.photo.label':  'Photo',
      'report.photo.tap':    'Tap to add a photo',
      'report.photo.remove': 'Remove photo',
      'report.loc.label':    'Location',
      'report.loc.map.hint': 'Click on the map to drop a pin — or use the button below.',
      'report.loc.geo':      '📍 Use my location',
      'report.loc.clear':    'Clear pin',
      'report.loc.addr.label':'Address / Landmark',
      'report.loc.addr.ph':  'e.g. MG Road, near Sector 7 Chowk',
      'report.submit':       'Submit Report',
      'report.submitting':   'Submitting…',

      /* Result card */
      'result.submitted':    'Report submitted',
      'result.your.id':      'Your tracking ID:',
      'result.copy':         '📋 Copy',
      'result.copied':       '✓ Copied',
      'result.dup.label':    'Possible duplicate:',
      'result.category':     'Category',
      'result.summary':      'Summary',
      'result.priority':     'Priority',
      'result.factors':      'Priority factors',
      'result.track.btn':    '🔍 Track this report',
      'result.new.btn':      '+ New report',

      /* Track page */
      'track.title':         'Track Your Report',
      'track.subtitle':      'Enter your tracking ID to see live status updates.',
      'track.id.label':      'Tracking ID',
      'track.id.ph':         'e.g. CIV-1007',
      'track.search':        'Search',
      'track.searching':     'Searching…',
      'track.live':          'Live',
      'track.offline':       'Offline',
      'track.category':      'Category',
      'track.priority':      'Priority',
      'track.summary':       'Summary',
      'track.assigned':      'Assigned to',
      'track.location':      'Location',
      'track.submitted':     'Submitted',
      'track.updated':       'Last updated',
      'track.factors':       'Priority factors',
      'track.history':       'Status history',
      'track.not.assigned':  'Not yet assigned',
      'track.no.history':    'No history yet.',
      'track.search.again':  '🔍 Search another ID',
      'track.not.found':     'Report not found',
      'track.try.another':   'Try another ID',
      'track.metoo.also':    'also reported this issue (linked to',
      'track.metoo.confirmed':'confirmed this issue. Tap Me Too if you\'re affected too.',
      'track.metoo.thanks':  'Thanks! Counted.',
      'track.metoo.btn':     '👍 Me Too',
      'track.dup.notice':    'This report is linked as a duplicate of',

      /* Status names */
      'status.Submitted':    'Submitted',
      'status.Under Review': 'Under Review',
      'status.Assigned':     'Assigned',
      'status.In Progress':  'In Progress',
      'status.Resolved':     'Resolved',

      /* Category names */
      'cat.Waterlogging':    '💧 Waterlogging',
      'cat.Road Damage':     '🛣 Road Damage',
      'cat.Garbage':         '🗑 Garbage',
      'cat.Streetlight':     '💡 Streetlight',
      'cat.Drainage':        '🚰 Drainage',
      'cat.Water Supply':    '🔧 Water Supply',

      /* Admin */
      'admin.overview':      'Overview',
      'admin.map':           'Priority Map',
      'admin.chart':         'Reports by Category',
      'admin.brief':         'Action Brief',
      'admin.brief.rule':    'Rule-based summary',
      'admin.all.reports':   'All Reports',
      'admin.filter.status': 'All statuses',
      'admin.filter.cat':    'All categories',
      'admin.filter.pri':    'All priorities',
      'admin.clear':         '✕ Clear',
      'admin.col.id':        'ID',
      'admin.col.title':     'Title',
      'admin.col.cat':       'Category',
      'admin.col.pri':       'Priority',
      'admin.col.status':    'Status',
      'admin.col.assigned':  'Assigned',
      'admin.col.date':      'Date',
      'admin.col.votes':     '👍 Votes',
      'admin.col.actions':   'Actions',
      'admin.update.btn':    'Update',
      'admin.update.title':  'Update Report',
      'admin.status.label':  'New Status',
      'admin.assign.label':  'Assign To',
      'admin.assign.ph':     'Officer name (optional)',
      'admin.note.label':    'Note',
      'admin.note.ph':       'Optional note for the status history',
      'admin.save':          '💾 Save Changes',
      'admin.close':         '✕ Close',
      'admin.loading':       'Loading reports…',
      'admin.failed':        'Failed to load reports.',
      'admin.no.match':      'No reports match the current filters.',

      /* Priority levels */
      'pri.Low':      'Low',
      'pri.Medium':   'Medium',
      'pri.High':     'High',
      'pri.Critical': 'Critical',

      /* Errors / misc */
      'err.enter.id':     'Please enter a tracking ID, e.g. CIV-1007.',
      'err.network':      'Network error — check your connection.',
      'err.desc.required':'Description is required.',
      'misc.optional':    '(optional)',
      'misc.required':    '*',
      'misc.dash':        '—',

      /* Explore page */
      'nav.explore':         'Explore',
      'explore.title':       'Explore Issues',
      'explore.subtitle':    'Search and filter public reports by category, status, priority, or date.',
      'explore.search.ph':   'Search by keyword, address…',
      'explore.search.btn':  'Search',
      'explore.filter.status':'All statuses',
      'explore.filter.cat':  'All categories',
      'explore.filter.pri':  'All priorities',
      'explore.clear':       '✕ Clear filters',
      'explore.total':       'reports found',
      'explore.none':        'No reports match your filters.',
      'explore.loading':     'Loading reports…',
      'explore.view.list':   'List',
      'explore.view.map':    'Map',
      'explore.demo.label':  'Demo',
      'explore.date.from':   'From date',
      'explore.date.to':     'To date',
      'explore.load.more':   'Load more',

      /* Report verification */
      'verify.heading':      'Was this issue fixed?',
      'verify.hint':         'Your feedback helps us close resolved issues accurately.',
      'verify.yes':          '✅ Yes, it\'s fixed',
      'verify.no':           '❌ No, still broken',
      'verify.note.ph':      'Optional: describe what you observed',
      'verify.confirm':      'Submit feedback',
      'verify.done':         'Thank you for your feedback!',

      /* Full status set */
      'status.Resolved—Awaiting Verification': 'Resolved — Awaiting Verification',
      'status.Closed':       'Closed',
      'status.Rejected':     'Rejected',
      'status.Duplicate':    'Duplicate',

      /* Chatbot */
      'chat.title':          'CivicBot',
      'chat.subtitle':       'Ask me anything about reporting',
      'chat.open':           'Chat with CivicBot',
      'chat.close':          'Close chat',
      'chat.ph':             'Type a question or a tracking ID…',
      'chat.send':           'Send',
      'chat.greeting':       'Hi! I\'m CivicBot. I can help you:\n• Submit or track a report\n• Understand what each status means\n• Look up a report by ID (e.g. CIV-1042)\n• Answer privacy and location questions\n\nWhat can I help you with?',
      'chat.typing':         'CivicBot is typing…',
      'chat.error':          'Could not reach the server. Please try again.',
      'chat.suggest.submit': 'How do I submit a report?',
      'chat.suggest.track':  'How do I track a report?',
      'chat.suggest.status': 'What does each status mean?',

      /* Admin extra */
      'admin.link.dup':      'Link duplicate',
      'admin.dup.of.label':  'Duplicate of (tracking ID)',
      'admin.dup.of.ph':     'e.g. CIV-1010',
      'admin.col.verified':  'Verified',

      /* Home hero */
      'home.hero.tag':       'AI-powered · Multilingual · Real-time',
      'home.cta.title':      'Report. Track. Resolve.',
      'home.stats.reports':  'Reports filed',
      'home.stats.resolved': 'Issues resolved',
      'home.stats.cities':   'Cities supported',
    },

    /* ------------------------------------------------------------------ */
    kn: { /* Kannada */
      'nav.home':       'ಮನೆ',
      'nav.report':     'ವರದಿ',
      'nav.track':      'ಟ್ರ್ಯಾಕ್',
      'nav.admin':      'ಆಡಳಿತ',
      'nav.lang':       'ಭಾಷೆ',
      'home.title':     'CivicReport ಗೆ ಸ್ವಾಗತ',
      'home.subtitle':  'ನಿಮ್ಮ ನಗರದ ನಾಗರಿಕ ಸಮಸ್ಯೆಗಳನ್ನು ವರದಿ ಮಾಡಿ.',
      'home.btn.report':'📝 ಸಮಸ್ಯೆ ವರದಿ ಮಾಡಿ',
      'home.btn.track': '🔍 ವರದಿ ಟ್ರ್ಯಾಕ್ ಮಾಡಿ',
      'home.btn.admin': '🛠 ಆಡಳಿತ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
      'report.page.title':   'ನಾಗರಿಕ ಸಮಸ್ಯೆ ವರದಿ ಮಾಡಿ',
      'report.page.subtitle':'ಸಮಸ್ಯೆ ವಿವರಿಸಿ. AI ಸ್ವಯಂಚಾಲಿತವಾಗಿ ವರ್ಗೀಕರಿಸುತ್ತದೆ.',
      'report.desc.label':   'ಸಮಸ್ಯೆ ಏನು?',
      'report.desc.ph':      'ಉದಾ: MG ರಸ್ತೆಯಲ್ಲಿ ದೊಡ್ಡ ಗುಂಡಿ…',
      'report.desc.hint':    'ಸ್ಥಳ, ತೀವ್ರತೆ ಮತ್ತು ಎಷ್ಟು ದಿನಗಳಿಂದ ಇದೆ ಎಂದು ತಿಳಿಸಿ.',
      'report.cat.label':    'ವರ್ಗ',
      'report.cat.auto':     '🤖 ಸ್ವಯಂ-ಪತ್ತೆ',
      'report.cat.hint':     'AI ವರ್ಗೀಕರಿಸಲು ಸ್ವಯಂ-ಪತ್ತೆ ಆರಿಸಿ.',
      'report.photo.label':  'ಫೋಟೋ',
      'report.photo.tap':    'ಫೋಟೋ ಸೇರಿಸಲು ಟ್ಯಾಪ್ ಮಾಡಿ',
      'report.photo.remove': 'ಫೋಟೋ ತೆಗೆದುಹಾಕಿ',
      'report.loc.label':    'ಸ್ಥಳ',
      'report.loc.map.hint': 'ನಕ್ಷೆಯ ಮೇಲೆ ಕ್ಲಿಕ್ ಮಾಡಿ — ಅಥವಾ ಕೆಳಗಿನ ಬಟನ್ ಬಳಸಿ.',
      'report.loc.geo':      '📍 ನನ್ನ ಸ್ಥಳ ಬಳಸಿ',
      'report.loc.clear':    'ಪಿನ್ ತೆಗೆದುಹಾಕಿ',
      'report.loc.addr.label':'ವಿಳಾಸ / ಲ್ಯಾಂಡ್‌ಮಾರ್ಕ್',
      'report.loc.addr.ph':  'ಉದಾ: MG ರಸ್ತೆ, ಸೆಕ್ಟರ್ 7 ಚೌಕ ಹತ್ತಿರ',
      'report.submit':       'ವರದಿ ಸಲ್ಲಿಸಿ',
      'report.submitting':   'ಸಲ್ಲಿಸಲಾಗುತ್ತಿದೆ…',
      'result.submitted':    'ವರದಿ ಸಲ್ಲಿಸಲಾಗಿದೆ',
      'result.your.id':      'ನಿಮ್ಮ ಟ್ರ್ಯಾಕಿಂಗ್ ID:',
      'result.copy':         '📋 ನಕಲು',
      'result.copied':       '✓ ನಕಲಾಗಿದೆ',
      'result.dup.label':    'ಸಂಭಾವ್ಯ ನಕಲು:',
      'result.track.btn':    '🔍 ವರದಿ ಟ್ರ್ಯಾಕ್ ಮಾಡಿ',
      'result.new.btn':      '+ ಹೊಸ ವರದಿ',
      'track.title':         'ನಿಮ್ಮ ವರದಿ ಟ್ರ್ಯಾಕ್ ಮಾಡಿ',
      'track.subtitle':      'ಟ್ರ್ಯಾಕಿಂಗ್ ID ನಮೂದಿಸಿ.',
      'track.id.label':      'ಟ್ರ್ಯಾಕಿಂಗ್ ID',
      'track.id.ph':         'ಉದಾ. CIV-1007',
      'track.search':        'ಹುಡುಕಿ',
      'track.searching':     'ಹುಡುಕಲಾಗುತ್ತಿದೆ…',
      'track.live':          'ಲೈವ್',
      'track.offline':       'ಆಫ್‌ಲೈನ್',
      'track.metoo.thanks':  'ಧನ್ಯವಾದ! ದಾಖಲಾಗಿದೆ.',
      'track.metoo.btn':     '👍 ನಾನೂ ಅನುಭವಿಸಿದ್ದೇನೆ',
      'status.Submitted':    'ಸಲ್ಲಿಸಲಾಗಿದೆ',
      'status.Under Review': 'ಪರಿಶೀಲನೆಯಲ್ಲಿದೆ',
      'status.Assigned':     'ನಿಯೋಜಿಸಲಾಗಿದೆ',
      'status.In Progress':  'ಪ್ರಗತಿಯಲ್ಲಿದೆ',
      'status.Resolved':     'ಪರಿಹರಿಸಲಾಗಿದೆ',
      'cat.Waterlogging':    '💧 ನೀರು ನಿಂತಿರುವಿಕೆ',
      'cat.Road Damage':     '🛣 ರಸ್ತೆ ಹಾನಿ',
      'cat.Garbage':         '🗑 ಕಸ',
      'cat.Streetlight':     '💡 ಬೀದಿ ದೀಪ',
      'cat.Drainage':        '🚰 ಒಳಚರಂಡಿ',
      'cat.Water Supply':    '🔧 ನೀರು ಸರಬರಾಜು',
      'err.enter.id':        'ದಯವಿಟ್ಟು ಟ್ರ್ಯಾಕಿಂಗ್ ID ನಮೂದಿಸಿ.',
      'err.network':         'ನೆಟ್‌ವರ್ಕ್ ದೋಷ — ಸಂಪರ್ಕ ಪರಿಶೀಲಿಸಿ.',
      'err.desc.required':   'ವಿವರಣೆ ಅಗತ್ಯ.',
    },

    /* ------------------------------------------------------------------ */
    hi: { /* Hindi */
      'nav.home':       'होम',
      'nav.report':     'रिपोर्ट',
      'nav.track':      'ट्रैक',
      'nav.admin':      'प्रशासन',
      'nav.lang':       'भाषा',
      'home.title':     'CivicReport में आपका स्वागत है',
      'home.subtitle':  'अपने शहर की नागरिक समस्याएं रिपोर्ट करें।',
      'home.btn.report':'📝 समस्या रिपोर्ट करें',
      'home.btn.track': '🔍 रिपोर्ट ट्रैक करें',
      'home.btn.admin': '🛠 एडमिन डैशबोर्ड',
      'report.page.title':   'नागरिक समस्या रिपोर्ट करें',
      'report.page.subtitle':'समस्या विवरण दें। AI स्वचालित रूप से वर्गीकृत करेगा।',
      'report.desc.label':   'समस्या क्या है?',
      'report.desc.ph':      'उदा: MG रोड पर बड़ा गड्ढा है जिससे वाहनों को नुकसान हो रहा है…',
      'report.desc.hint':    'स्थान, गंभीरता और कब से है यह बताएं।',
      'report.cat.label':    'श्रेणी',
      'report.cat.auto':     '🤖 स्वतः पहचान',
      'report.cat.hint':     'AI वर्गीकरण के लिए स्वतः पहचान चुनें।',
      'report.photo.label':  'फोटो',
      'report.photo.tap':    'फोटो जोड़ने के लिए टैप करें',
      'report.photo.remove': 'फोटो हटाएं',
      'report.loc.label':    'स्थान',
      'report.loc.map.hint': 'नक्शे पर क्लिक करें — या नीचे बटन का उपयोग करें।',
      'report.loc.geo':      '📍 मेरा स्थान उपयोग करें',
      'report.loc.clear':    'पिन हटाएं',
      'report.loc.addr.label':'पता / लैंडमार्क',
      'report.loc.addr.ph':  'उदा: MG रोड, सेक्टर 7 चौक के पास',
      'report.submit':       'रिपोर्ट सबमिट करें',
      'report.submitting':   'सबमिट हो रहा है…',
      'result.submitted':    'रिपोर्ट सबमिट हो गई',
      'result.your.id':      'आपकी ट्रैकिंग ID:',
      'result.copy':         '📋 कॉपी करें',
      'result.copied':       '✓ कॉपी हो गया',
      'result.dup.label':    'संभावित डुप्लिकेट:',
      'result.track.btn':    '🔍 रिपोर्ट ट्रैक करें',
      'result.new.btn':      '+ नई रिपोर्ट',
      'track.title':         'अपनी रिपोर्ट ट्रैक करें',
      'track.subtitle':      'लाइव स्थिति देखने के लिए ट्रैकिंग ID दर्ज करें।',
      'track.id.label':      'ट्रैकिंग ID',
      'track.id.ph':         'उदा. CIV-1007',
      'track.search':        'खोजें',
      'track.searching':     'खोज रहे हैं…',
      'track.live':          'लाइव',
      'track.offline':       'ऑफलाइन',
      'track.metoo.thanks':  'धन्यवाद! दर्ज हो गया।',
      'track.metoo.btn':     '👍 मुझे भी यही समस्या है',
      'status.Submitted':    'सबमिट किया',
      'status.Under Review': 'समीक्षाधीन',
      'status.Assigned':     'आवंटित',
      'status.In Progress':  'प्रगति में',
      'status.Resolved':     'हल हो गया',
      'cat.Waterlogging':    '💧 जलभराव',
      'cat.Road Damage':     '🛣 सड़क क्षति',
      'cat.Garbage':         '🗑 कूड़ा',
      'cat.Streetlight':     '💡 स्ट्रीटलाइट',
      'cat.Drainage':        '🚰 जल निकासी',
      'cat.Water Supply':    '🔧 जल आपूर्ति',
      'err.enter.id':        'कृपया ट्रैकिंग ID दर्ज करें, जैसे CIV-1007।',
      'err.network':         'नेटवर्क त्रुटि — कनेक्शन जाँचें।',
      'err.desc.required':   'विवरण आवश्यक है।',
    },

    /* ------------------------------------------------------------------ */
    ta: { /* Tamil */
      'nav.home':       'முகப்பு',
      'nav.report':     'அறிக்கை',
      'nav.track':      'கண்காணி',
      'nav.admin':      'நிர்வாகம்',
      'nav.lang':       'மொழி',
      'home.title':     'CivicReport-க்கு வரவேற்கிறோம்',
      'home.subtitle':  'உங்கள் நகரின் குடிமைப் பிரச்சினைகளை அறிக்கையிடுங்கள்.',
      'home.btn.report':'📝 சிக்கலை அறிக்கையிடுங்கள்',
      'home.btn.track': '🔍 அறிக்கையை கண்காணியுங்கள்',
      'home.btn.admin': '🛠 நிர்வாக டாஷ்போர்டு',
      'report.page.title':   'குடிமைப் சிக்கலை அறிக்கையிடுங்கள்',
      'report.page.subtitle':'சிக்கலை விவரியுங்கள். AI தானாக வகைப்படுத்தும்.',
      'report.desc.label':   'சிக்கல் என்ன?',
      'report.desc.ph':      'எ.கா: MG ரோட்டில் பெரிய குழி உள்ளது…',
      'report.cat.label':    'வகை',
      'report.cat.auto':     '🤖 தானாக கண்டறி',
      'report.submit':       'அறிக்கையை சமர்ப்பிக்கவும்',
      'report.submitting':   'சமர்ப்பிக்கிறது…',
      'track.title':         'உங்கள் அறிக்கையை கண்காணியுங்கள்',
      'track.search':        'தேடு',
      'track.live':          'நேரடி',
      'track.metoo.thanks':  'நன்றி! பதிவு செய்யப்பட்டது.',
      'track.metoo.btn':     '👍 என்னிடமும் உள்ளது',
      'status.Submitted':    'சமர்ப்பிக்கப்பட்டது',
      'status.Under Review': 'மதிப்பாய்வில் உள்ளது',
      'status.Assigned':     'ஒதுக்கப்பட்டது',
      'status.In Progress':  'நடந்து கொண்டிருக்கிறது',
      'status.Resolved':     'தீர்க்கப்பட்டது',
      'cat.Waterlogging':    '💧 தண்ணீர் தேக்கம்',
      'cat.Road Damage':     '🛣 சாலை சேதம்',
      'cat.Garbage':         '🗑 குப்பை',
      'cat.Streetlight':     '💡 தெரு விளக்கு',
      'cat.Drainage':        '🚰 வடிகால்',
      'cat.Water Supply':    '🔧 தண்ணீர் விநியோகம்',
      'err.enter.id':        'தயவுசெய்து கண்காணிப்பு ID ஐ உள்ளிடுங்கள்.',
      'err.network':         'நெட்வொர்க் பிழை — இணைப்பை சரிபாருங்கள்.',
    },

    /* ------------------------------------------------------------------ */
    te: { /* Telugu */
      'nav.home':       'హోమ్',
      'nav.report':     'నివేదిక',
      'nav.track':      'ట్రాక్',
      'nav.admin':      'నిర్వాహక',
      'nav.lang':       'భాష',
      'home.title':     'CivicReport కు స్వాగతం',
      'home.subtitle':  'మీ నగరంలోని పౌర సమస్యలను నివేదించండి.',
      'home.btn.report':'📝 సమస్య నివేదించండి',
      'home.btn.track': '🔍 నివేదిక ట్రాక్ చేయండి',
      'home.btn.admin': '🛠 నిర్వాహక డాష్‌బోర్డ్',
      'report.page.title':   'పౌర సమస్య నివేదించండి',
      'report.page.subtitle':'సమస్య వివరించండి. AI స్వయంచాలకంగా వర్గీకరిస్తుంది.',
      'report.desc.label':   'సమస్య ఏమిటి?',
      'report.desc.ph':      'ఉదా: MG రోడ్ పై పెద్ద గుంట ఉంది…',
      'report.cat.label':    'వర్గం',
      'report.cat.auto':     '🤖 స్వయంచాలక గుర్తింపు',
      'report.submit':       'నివేదిక సమర్పించండి',
      'report.submitting':   'సమర్పిస్తోంది…',
      'track.title':         'మీ నివేదికను ట్రాక్ చేయండి',
      'track.search':        'వెతుకు',
      'track.live':          'లైవ్',
      'track.metoo.thanks':  'ధన్యవాదాలు! నమోదు చేయబడింది.',
      'track.metoo.btn':     '👍 నాకూ ఇదే సమస్య',
      'status.Submitted':    'సమర్పించబడింది',
      'status.Under Review': 'సమీక్షలో ఉంది',
      'status.Assigned':     'కేటాయించబడింది',
      'status.In Progress':  'పురోగతిలో ఉంది',
      'status.Resolved':     'పరిష్కరించబడింది',
      'cat.Waterlogging':    '💧 నీరు నిల్వ',
      'cat.Road Damage':     '🛣 రోడ్డు నష్టం',
      'cat.Garbage':         '🗑 చెత్త',
      'cat.Streetlight':     '💡 వీధి దీపం',
      'cat.Drainage':        '🚰 మురుగు',
      'cat.Water Supply':    '🔧 నీటి సరఫరా',
      'err.enter.id':        'దయచేసి ట్రాకింగ్ ID నమోదు చేయండి.',
      'err.network':         'నెట్‌వర్క్ లోపం — కనెక్షన్ తనిఖీ చేయండి.',
    },

    /* ------------------------------------------------------------------ */
    ml: { /* Malayalam */
      'nav.home':       'ഹോം',
      'nav.report':     'റിപ്പോർട്ട്',
      'nav.track':      'ട്രാക്ക്',
      'nav.admin':      'അഡ്മിൻ',
      'nav.lang':       'ഭാഷ',
      'home.title':     'CivicReport-ലേക്ക് സ്വാഗതം',
      'home.subtitle':  'നഗരത്തിലെ പ്രശ്നങ്ങൾ റിപ്പോർട്ട് ചെയ്യൂ.',
      'home.btn.report':'📝 പ്രശ്നം റിപ്പോർട്ട് ചെയ്യൂ',
      'home.btn.track': '🔍 റിപ്പോർട്ട് ട്രാക്ക് ചെയ്യൂ',
      'home.btn.admin': '🛠 അഡ്മിൻ ഡാഷ്ബോർഡ്',
      'report.page.title':   'പൌര പ്രശ്നം റിപ്പോർട്ട് ചെയ്യൂ',
      'report.page.subtitle':'പ്രശ്നം വിവരിക്കൂ. AI സ്വയമേ തരംതിരിക്കും.',
      'report.desc.label':   'എന്താണ് പ്രശ്നം?',
      'report.desc.ph':      'ഉദാ: MG റോഡിൽ വലിയ കുഴി…',
      'report.cat.label':    'വിഭാഗം',
      'report.cat.auto':     '🤖 സ്വയം കണ്ടെത്തൂ',
      'report.submit':       'റിപ്പോർട്ട് സമർപ്പിക്കൂ',
      'report.submitting':   'സമർപ്പിക്കുന്നു…',
      'track.title':         'നിങ്ങളുടെ റിപ്പോർട്ട് ട്രാക്ക് ചെയ്യൂ',
      'track.search':        'തിരയൂ',
      'track.live':          'ലൈവ്',
      'track.metoo.thanks':  'നന്ദി! രേഖപ്പെടുത്തി.',
      'track.metoo.btn':     '👍 എനിക്കും ഇതേ പ്രശ്നം',
      'status.Submitted':    'സമർപ്പിച്ചു',
      'status.Under Review': 'അവലോകനത്തിൽ',
      'status.Assigned':     'നിയോഗിച്ചു',
      'status.In Progress':  'പുരോഗതിയിൽ',
      'status.Resolved':     'പരിഹരിച്ചു',
      'cat.Waterlogging':    '💧 വെള്ളക്കെട്ട്',
      'cat.Road Damage':     '🛣 റോഡ് കേടുപാടുകൾ',
      'cat.Garbage':         '🗑 മാലിന്യം',
      'cat.Streetlight':     '💡 തെരുവ് വിളക്ക്',
      'cat.Drainage':        '🚰 ഡ്രെയിനേജ്',
      'cat.Water Supply':    '🔧 ജലവിതരണം',
      'err.enter.id':        'ട്രാക്കിംഗ് ID നൽകൂ.',
      'err.network':         'നെറ്റ്‌വർക്ക് പിശക് — കണക്ഷൻ പരിശോധിക്കൂ.',
    },

    /* ------------------------------------------------------------------ */
    mr: { /* Marathi */
      'nav.home':       'मुख्यपृष्ठ',
      'nav.report':     'अहवाल',
      'nav.track':      'मागोवा',
      'nav.admin':      'प्रशासन',
      'nav.lang':       'भाषा',
      'home.title':     'CivicReport मध्ये आपले स्वागत आहे',
      'home.subtitle':  'आपल्या शहरातील नागरी समस्या नोंदवा.',
      'home.btn.report':'📝 समस्या नोंदवा',
      'home.btn.track': '🔍 अहवाल मागोवा घ्या',
      'home.btn.admin': '🛠 प्रशासन डॅशबोर्ड',
      'report.page.title':   'नागरी समस्या नोंदवा',
      'report.page.subtitle':'समस्या सांगा. AI आपोआप वर्गीकरण करेल.',
      'report.desc.label':   'समस्या काय आहे?',
      'report.desc.ph':      'उदा: MG रस्त्यावर मोठा खड्डा आहे…',
      'report.cat.label':    'श्रेणी',
      'report.cat.auto':     '🤖 स्वयं-ओळख',
      'report.submit':       'अहवाल सादर करा',
      'report.submitting':   'सादर होत आहे…',
      'track.title':         'आपल्या अहवालाचा मागोवा घ्या',
      'track.search':        'शोधा',
      'track.live':          'थेट',
      'track.metoo.thanks':  'धन्यवाद! नोंद केली.',
      'track.metoo.btn':     '👍 मलाही हीच समस्या',
      'status.Submitted':    'सादर केले',
      'status.Under Review': 'आढाव्यात',
      'status.Assigned':     'नियुक्त केले',
      'status.In Progress':  'प्रगतीत',
      'status.Resolved':     'सोडवले',
      'cat.Waterlogging':    '💧 पाणी साचणे',
      'cat.Road Damage':     '🛣 रस्ता नुकसान',
      'cat.Garbage':         '🗑 कचरा',
      'cat.Streetlight':     '💡 रस्त्यावरील दिवा',
      'cat.Drainage':        '🚰 गटार',
      'cat.Water Supply':    '🔧 पाणीपुरवठा',
      'err.enter.id':        'कृपया ट्रॅकिंग ID प्रविष्ट करा.',
      'err.network':         'नेटवर्क त्रुटी — कनेक्शन तपासा.',
    },

    /* ------------------------------------------------------------------ */
    ur: { /* Urdu (RTL) */
      'nav.home':       'ہوم',
      'nav.report':     'رپورٹ',
      'nav.track':      'ٹریک',
      'nav.admin':      'ایڈمن',
      'nav.explore':    'دریافت',
      'nav.lang':       'زبان',
      'home.title':     'CivicReport میں خوش آمدید',
      'home.subtitle':  'اپنے شہر کی شہری مسائل رپورٹ کریں۔',
      'home.btn.report':'📝 مسئلہ رپورٹ کریں',
      'home.btn.track': '🔍 رپورٹ ٹریک کریں',
      'home.btn.admin': '🛠 ایڈمن ڈیش بورڈ',
      'home.hero.tag':  'AI · کثیر لسانی · ریئل ٹائم',
      'report.page.title':   'شہری مسئلہ رپورٹ کریں',
      'report.page.subtitle':'مسئلہ بیان کریں۔ AI خودکار طور پر درجہ بندی کرے گا۔',
      'report.desc.label':   'مسئلہ کیا ہے؟',
      'report.desc.ph':      'مثال: MG روڈ پر بڑا گڑھا ہے…',
      'report.cat.label':    'زمرہ',
      'report.cat.auto':     '🤖 خودکار شناخت',
      'report.submit':       'رپورٹ جمع کریں',
      'report.submitting':   'جمع ہو رہا ہے…',
      'track.title':         'اپنی رپورٹ ٹریک کریں',
      'track.search':        'تلاش کریں',
      'track.live':          'براہ راست',
      'track.metoo.thanks':  'شکریہ! درج ہو گیا۔',
      'track.metoo.btn':     '👍 مجھے بھی یہی مسئلہ ہے',
      'status.Submitted':    'جمع کیا',
      'status.Under Review': 'زیر جائزہ',
      'status.Assigned':     'تفویض شدہ',
      'status.In Progress':  'جاری ہے',
      'status.Resolved':     'حل ہو گیا',
      'status.Resolved—Awaiting Verification': 'حل ہو گیا — تصدیق کا انتظار',
      'status.Closed':       'بند',
      'status.Rejected':     'مسترد',
      'status.Duplicate':    'نقل',
      'cat.Waterlogging':    '💧 پانی جمع ہونا',
      'cat.Road Damage':     '🛣 سڑک نقصان',
      'cat.Garbage':         '🗑 کچرا',
      'cat.Streetlight':     '💡 سڑک کی روشنی',
      'cat.Drainage':        '🚰 نکاسی',
      'cat.Water Supply':    '🔧 پانی کی فراہمی',
      'err.enter.id':        'براہ کرم ٹریکنگ ID درج کریں۔',
      'err.network':         'نیٹ ورک خرابی — کنیکشن چیک کریں۔',
      'explore.title':       'مسائل دریافت کریں',
      'explore.search.ph':   'کلیدی لفظ سے تلاش کریں…',
      'explore.search.btn':  'تلاش',
      'explore.none':        'کوئی رپورٹ نہیں ملی۔',
      'verify.yes':          '✅ ہاں، ٹھیک ہو گیا',
      'verify.no':           '❌ نہیں، ابھی بھی خراب ہے',
      'chat.title':          'CivicBot',
      'chat.ph':             'سوال لکھیں یا ٹریکنگ ID…',
      'chat.send':           'بھیجیں',
    },

    /* ------------------------------------------------------------------ */
    bn: { /* Bengali */
      'nav.home':       'হোম',
      'nav.report':     'রিপোর্ট',
      'nav.track':      'ট্র্যাক',
      'nav.admin':      'প্রশাসন',
      'nav.explore':    'অন্বেষণ',
      'nav.lang':       'ভাষা',
      'home.title':     'CivicReport-এ আপনাকে স্বাগতম',
      'home.subtitle':  'আপনার শহরের নাগরিক সমস্যা রিপোর্ট করুন।',
      'home.btn.report':'📝 সমস্যা রিপোর্ট করুন',
      'home.btn.track': '🔍 রিপোর্ট ট্র্যাক করুন',
      'home.btn.admin': '🛠 অ্যাডমিন ড্যাশবোর্ড',
      'home.hero.tag':  'AI-চালিত · বহুভাষিক · রিয়েল-টাইম',
      'report.page.title':   'নাগরিক সমস্যা রিপোর্ট করুন',
      'report.page.subtitle':'সমস্যা বর্ণনা করুন। AI স্বয়ংক্রিয়ভাবে শ্রেণীবদ্ধ করবে।',
      'report.desc.label':   'সমস্যা কী?',
      'report.desc.ph':      'যেমন: MG রোডে একটি বড় গর্ত আছে…',
      'report.desc.hint':    'স্থান, তীব্রতা এবং কতদিন ধরে আছে তা জানান।',
      'report.cat.label':    'বিভাগ',
      'report.cat.auto':     '🤖 স্বয়ংক্রিয় শনাক্ত',
      'report.cat.hint':     'AI শ্রেণীবদ্ধ করতে স্বয়ংক্রিয় শনাক্ত রাখুন।',
      'report.photo.label':  'ছবি',
      'report.photo.tap':    'ছবি যোগ করতে ট্যাপ করুন',
      'report.photo.remove': 'ছবি সরান',
      'report.loc.label':    'অবস্থান',
      'report.loc.map.hint': 'মানচিত্রে ক্লিক করুন — বা নিচের বোতাম ব্যবহার করুন।',
      'report.loc.geo':      '📍 আমার অবস্থান ব্যবহার করুন',
      'report.loc.clear':    'পিন সরান',
      'report.loc.addr.label':'ঠিকানা / ল্যান্ডমার্ক',
      'report.loc.addr.ph':  'যেমন: MG রোড, সেক্টর ৭ চৌক-এর কাছে',
      'report.submit':       'রিপোর্ট জমা দিন',
      'report.submitting':   'জমা হচ্ছে…',
      'result.submitted':    'রিপোর্ট জমা হয়েছে',
      'result.your.id':      'আপনার ট্র্যাকিং ID:',
      'result.copy':         '📋 কপি করুন',
      'result.copied':       '✓ কপি হয়েছে',
      'result.dup.label':    'সম্ভাব্য ডুপ্লিকেট:',
      'result.category':     'বিভাগ',
      'result.summary':      'সারসংক্ষেপ',
      'result.priority':     'অগ্রাধিকার',
      'result.factors':      'অগ্রাধিকারের কারণ',
      'result.track.btn':    '🔍 রিপোর্ট ট্র্যাক করুন',
      'result.new.btn':      '+ নতুন রিপোর্ট',
      'track.title':         'আপনার রিপোর্ট ট্র্যাক করুন',
      'track.subtitle':      'লাইভ আপডেট দেখতে ট্র্যাকিং ID লিখুন।',
      'track.id.label':      'ট্র্যাকিং ID',
      'track.id.ph':         'যেমন: CIV-1007',
      'track.search':        'খুঁজুন',
      'track.searching':     'খোঁজা হচ্ছে…',
      'track.live':          'লাইভ',
      'track.offline':       'অফলাইন',
      'track.category':      'বিভাগ',
      'track.priority':      'অগ্রাধিকার',
      'track.summary':       'সারসংক্ষেপ',
      'track.assigned':      'নিযুক্ত',
      'track.location':      'অবস্থান',
      'track.submitted':     'জমা দেওয়া হয়েছে',
      'track.updated':       'সর্বশেষ আপডেট',
      'track.factors':       'অগ্রাধিকারের কারণ',
      'track.history':       'স্ট্যাটাস ইতিহাস',
      'track.not.assigned':  'এখনও নিযুক্ত হয়নি',
      'track.no.history':    'এখনও কোনো ইতিহাস নেই।',
      'track.search.again':  '🔍 অন্য ID খুঁজুন',
      'track.not.found':     'রিপোর্ট পাওয়া যায়নি',
      'track.try.another':   'অন্য ID চেষ্টা করুন',
      'track.metoo.btn':     '👍 আমারও এই সমস্যা',
      'track.metoo.thanks':  'ধন্যবাদ! গণনা করা হয়েছে।',
      'track.dup.notice':    'এই রিপোর্টটি ডুপ্লিকেট হিসেবে লিঙ্ক করা হয়েছে',
      'status.Submitted':    'জমা দেওয়া হয়েছে',
      'status.Under Review': 'পর্যালোচনাধীন',
      'status.Assigned':     'নিযুক্ত',
      'status.In Progress':  'চলমান',
      'status.Resolved':     'সমাধান হয়েছে',
      'status.Resolved—Awaiting Verification': 'সমাধান — যাচাইয়ের অপেক্ষায়',
      'status.Closed':       'বন্ধ',
      'status.Rejected':     'প্রত্যাখ্যাত',
      'status.Duplicate':    'ডুপ্লিকেট',
      'cat.Waterlogging':    '💧 জলাবদ্ধতা',
      'cat.Road Damage':     '🛣 রাস্তার ক্ষতি',
      'cat.Garbage':         '🗑 বর্জ্য',
      'cat.Streetlight':     '💡 পথবাতি',
      'cat.Drainage':        '🚰 নর্দমা',
      'cat.Water Supply':    '🔧 জলসরবরাহ',
      'pri.Low':      'কম',
      'pri.Medium':   'মাঝারি',
      'pri.High':     'বেশি',
      'pri.Critical': 'জরুরি',
      'err.enter.id':        'অনুগ্রহ করে ট্র্যাকিং ID লিখুন, যেমন CIV-1007।',
      'err.network':         'নেটওয়ার্ক ত্রুটি — সংযোগ পরীক্ষা করুন।',
      'err.desc.required':   'বিবরণ প্রয়োজন।',
      'misc.optional':       '(ঐচ্ছিক)',
      'misc.required':       '*',
      'misc.dash':           '—',
      'explore.title':       'সমস্যা অন্বেষণ করুন',
      'explore.subtitle':    'বিভাগ, স্ট্যাটাস, অগ্রাধিকার বা তারিখ দিয়ে রিপোর্ট ফিল্টার করুন।',
      'explore.search.ph':   'কীওয়ার্ড বা ঠিকানা দিয়ে খুঁজুন…',
      'explore.search.btn':  'খুঁজুন',
      'explore.filter.status':'সব স্ট্যাটাস',
      'explore.filter.cat':  'সব বিভাগ',
      'explore.filter.pri':  'সব অগ্রাধিকার',
      'explore.clear':       '✕ ফিল্টার সাফ',
      'explore.total':       'টি রিপোর্ট পাওয়া গেছে',
      'explore.none':        'কোনো রিপোর্ট মেলেনি।',
      'explore.loading':     'রিপোর্ট লোড হচ্ছে…',
      'explore.view.list':   'তালিকা',
      'explore.view.map':    'মানচিত্র',
      'explore.demo.label':  'ডেমো',
      'explore.load.more':   'আরও লোড করুন',
      'verify.heading':      'এই সমস্যাটি কি ঠিক হয়েছে?',
      'verify.hint':         'আপনার মতামত আমাদের সঠিকভাবে বন্ধ করতে সাহায্য করে।',
      'verify.yes':          '✅ হ্যাঁ, ঠিক হয়েছে',
      'verify.no':           '❌ না, এখনও ভাঙা',
      'verify.note.ph':      'ঐচ্ছিক: আপনি যা দেখেছেন তা বর্ণনা করুন',
      'verify.confirm':      'মতামত জমা দিন',
      'verify.done':         'আপনার মতামতের জন্য ধন্যবাদ!',
      'chat.title':          'CivicBot',
      'chat.subtitle':       'রিপোর্ট সম্পর্কে যেকোনো প্রশ্ন করুন',
      'chat.open':           'CivicBot-এর সাথে চ্যাট করুন',
      'chat.close':          'চ্যাট বন্ধ করুন',
      'chat.ph':             'প্রশ্ন বা ট্র্যাকিং ID লিখুন…',
      'chat.send':           'পাঠান',
      'chat.greeting':       'হ্যালো! আমি CivicBot। আমি আপনাকে সাহায্য করতে পারি:\n• রিপোর্ট জমা বা ট্র্যাক করতে\n• প্রতিটি স্ট্যাটাসের মানে বুঝতে\n• ID দিয়ে রিপোর্ট দেখতে (যেমন CIV-1042)\n• গোপনীয়তা ও অবস্থান প্রশ্নের উত্তর দিতে',
      'chat.typing':         'CivicBot টাইপ করছে…',
      'chat.error':          'সার্ভারে পৌঁছানো যায়নি। আবার চেষ্টা করুন।',
      'chat.suggest.submit': 'রিপোর্ট কীভাবে জমা দেব?',
      'chat.suggest.track':  'রিপোর্ট কীভাবে ট্র্যাক করব?',
      'chat.suggest.status': 'প্রতিটি স্ট্যাটাসের মানে কী?',
      'admin.overview':      'সংক্ষিপ্ত বিবরণ',
      'admin.map':           'অগ্রাধিকার মানচিত্র',
      'admin.all.reports':   'সব রিপোর্ট',
      'admin.save':          '💾 পরিবর্তন সংরক্ষণ করুন',
      'admin.close':         '✕ বন্ধ করুন',
      'admin.link.dup':      'ডুপ্লিকেট লিঙ্ক করুন',
      'home.hero.tag':       'AI-চালিত · বহুভাষিক · রিয়েল-টাইম',
      'home.cta.title':      'রিপোর্ট। ট্র্যাক। সমাধান।',
    },
  };

  /* ── Languages supported (code → display name) ─────────────────── */
  const LANGS = [
    { code: 'en', label: 'English',    rtl: false },
    { code: 'hi', label: 'हिन्दी',      rtl: false },
    { code: 'bn', label: 'বাংলা',       rtl: false },
    { code: 'kn', label: 'ಕನ್ನಡ',       rtl: false },
    { code: 'ta', label: 'தமிழ்',       rtl: false },
    { code: 'te', label: 'తెలుగు',      rtl: false },
    { code: 'ml', label: 'മലയാളം',      rtl: false },
    { code: 'mr', label: 'मराठी',       rtl: false },
    { code: 'ur', label: 'اردو',        rtl: true  },
  ];

  /* ── State ─────────────────────────────────────────────────────── */
  const LS_KEY = 'civicreport_lang';
  let _current = localStorage.getItem(LS_KEY) || 'en';

  /* ── Core translation function ─────────────────────────────────── */
  /**
   * Translate a key, falling back to English if the key is missing in
   * the current language.
   * @param {string} key  Dot-namespaced key, e.g. 'nav.home'
   * @returns {string}
   */
  function t(key) {
    const dict = TRANSLATIONS[_current] || {};
    return dict[key] ?? TRANSLATIONS['en'][key] ?? key;
  }

  /* ── DOM walker: apply translations ────────────────────────────── */
  /**
   * Walk the entire document (or a subtree) and replace text / attributes
   * for every element that has a data-i18n* attribute.
   * @param {Element} [root=document.body]
   */
  function applyToDOM(root) {
    const base = root || document.body;

    // textContent replacements
    base.querySelectorAll('[data-i18n]').forEach(el => {
      el.textContent = t(el.dataset.i18n);
    });

    // placeholder replacements
    base.querySelectorAll('[data-i18n-ph]').forEach(el => {
      el.placeholder = t(el.dataset.i18nPh);
    });

    // title attribute replacements
    base.querySelectorAll('[data-i18n-title]').forEach(el => {
      el.title = t(el.dataset.i18nTitle);
    });

    // aria-label replacements
    base.querySelectorAll('[data-i18n-aria]').forEach(el => {
      el.setAttribute('aria-label', t(el.dataset.i18nAria));
    });
  }

  /* ── RTL support ───────────────────────────────────────────────── */
  function applyDir() {
    const meta = LANGS.find(l => l.code === _current);
    document.documentElement.setAttribute('dir', meta && meta.rtl ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', _current);
  }

  /* ── Build and inject the language switcher <select> ───────────── */
  /**
   * Inject a language-selector <select> into `.header-nav` on the current page.
   * Skips injection if the switcher is already present.
   */
  function injectSwitcher() {
    const nav = document.querySelector('.header-nav');
    if (!nav || nav.querySelector('.lang-switcher')) return;

    const wrapper = document.createElement('span');
    wrapper.className = 'lang-switcher-wrap';

    const sel = document.createElement('select');
    sel.className      = 'lang-switcher';
    sel.title          = t('nav.lang');
    sel.setAttribute('aria-label', t('nav.lang'));

    LANGS.forEach(l => {
      const opt = document.createElement('option');
      opt.value       = l.code;
      opt.textContent = l.label;
      if (l.code === _current) opt.selected = true;
      sel.appendChild(opt);
    });

    sel.addEventListener('change', () => setLang(sel.value));
    wrapper.appendChild(sel);
    nav.appendChild(wrapper);
  }

  /* ── Public setLang ────────────────────────────────────────────── */
  /**
   * Switch the UI language, persist to localStorage, and re-apply translations.
   * Also updates SpeechRecognition and SpeechSynthesis language if available.
   * @param {string} code  BCP-47-like code, e.g. 'hi', 'kn', 'ur'
   */
  function setLang(code) {
    if (!TRANSLATIONS[code]) code = 'en';  // safety fallback
    _current = code;
    localStorage.setItem(LS_KEY, code);
    applyDir();
    applyToDOM();

    // Update the switcher <select> value in case setLang was called from JS
    const sel = document.querySelector('.lang-switcher');
    if (sel) sel.value = code;

    // Notify other modules that language changed (e.g. voice input, chatbot)
    document.dispatchEvent(new CustomEvent('civicLangChange', { detail: { lang: code } }));
  }

  /* ── BCP-47 locale mapping for Web Speech API ──────────────────── */
  const SPEECH_LOCALE = {
    en: 'en-IN',
    hi: 'hi-IN',
    kn: 'kn-IN',
    ta: 'ta-IN',
    te: 'te-IN',
    ml: 'ml-IN',
    mr: 'mr-IN',
    ur: 'ur-PK',
  };

  /** Return the BCP-47 locale for the current language (for Web Speech API). */
  function speechLocale() {
    return SPEECH_LOCALE[_current] || 'en-IN';
  }

  /** Return the current language code. */
  function currentLang() { return _current; }

  /* ── Initialise on DOMContentLoaded ────────────────────────────── */
  function init() {
    applyDir();
    injectSwitcher();
    applyToDOM();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* ── Expose public API ─────────────────────────────────────────── */
  window.i18n = { t, setLang, currentLang, speechLocale, applyToDOM, LANGS };

})();
