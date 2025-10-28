# Multi-Raffle Management System - Technical Specification

## Document Information
- **Version:** 1.0
- **Date:** October 27, 2025
- **System Name:** Multi-Raffle Management System
- **Platform:** Progressive Web Application (PWA)

---

## 1. Executive Summary

The Multi-Raffle Management System is a comprehensive web-based Progressive Web Application designed to manage multiple concurrent raffles with complete ticket management, payment tracking, and automated winner selection. The system provides secure access control, mobile-first design, offline capabilities, and professional audit trail features including screen recording of draw events.

### 1.1 Key Features
- Multi-raffle management with individual configurations
- Secure password-protected access
- Buyer and ticket management with unique ticket numbering
- Payment tracking and verification
- Automated winner selection with payment enforcement
- Professional 6-stage draw narrative experience
- Screen recording for audit purposes (desktop browsers)
- QR code generation for payment links
- Banking details management
- CSV data export functionality
- Image upload with automatic thumbnail generation
- Progressive Web App (PWA) with offline support

---

## 2. System Architecture

### 2.1 Technology Stack

**Backend:**
- **Framework:** Flask (Python)
- **CORS:** Flask-CORS
- **Image Processing:** Pillow (PIL)
- **QR Code Generation:** qrcode library
- **File Storage:** JSON-based data persistence

**Frontend:**
- **Core:** Vanilla JavaScript (ES6+)
- **Styling:** Custom CSS with responsive design
- **PWA:** Service Worker with caching strategies
- **Recording:** MediaRecorder API

**Data Storage:**
- `raffle_data.json` - Raffle configurations and metadata
- `buyers.json` - Buyer information and ticket assignments
- `uploads/` - Raffle images (full size)
- `uploads/thumbnails/` - Optimized image thumbnails

### 2.2 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Login      │  │   Raffle     │  │    Buyer     │      │
│  │  Interface   │  │  Management  │  │  Management  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │    Draw      │  │   Payment    │  │    Export    │      │
│  │   System     │  │   Tracking   │  │   Features   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                     Service Worker Layer                     │
│               (Caching & Offline Support)                    │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                      Flask Backend API                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Raffle     │  │    Buyer     │  │    Draw      │      │
│  │   Endpoints  │  │   Endpoints  │  │   Endpoints  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Payment    │  │    Image     │  │    File      │      │
│  │   Endpoints  │  │   Processing │  │   Serving    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                      Data Storage Layer                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ raffle_data  │  │   buyers     │  │   uploads    │      │
│  │   .json      │  │    .json     │  │   folder     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Functional Requirements

### 3.1 Authentication & Security

**FR-SEC-001: Password Protection**
- System requires password authentication ("raffle2024")
- Login screen displayed on application load
- Session persists until browser close/refresh
- Invalid attempts show error feedback
- Enter key support for quick login

**FR-SEC-002: Access Control**
- All raffle management features require authentication
- Login screen blocks access to application content
- No API authentication (suitable for internal/controlled use)

### 3.2 Raffle Management

**FR-RAF-001: Create Raffle**
- **Required Fields:**
  - Raffle Name
  - Draw Date (date picker)
  - Prize Description
  - Ticket Cost (numeric, currency)
  - Capitec Payment Link (URL)
  
- **Optional Fields:**
  - Advertisement Image (PNG, JPG, JPEG, GIF, WEBP)
  - Banking Details:
    - Account Owner
    - Bank Name
    - Branch Code
    - Account Number
    - Account Type (Savings/Cheque/Current)

**FR-RAF-002: Update Raffle**
- Edit all raffle details except drawn status and winner
- Replace advertisement image (old image deleted)
- Preserve buyer and ticket data
- Form validation with required field enforcement

**FR-RAF-003: Delete Raffle**
- Remove raffle from system
- Delete associated buyers and tickets
- Remove image files (full size and thumbnail)
- Confirmation prompt before deletion

**FR-RAF-004: View Raffles**
- Display all raffles in card-based list
- Show thumbnail images
- Display days until draw date
- Visual status indicators:
  - **Prize Drawn:** Orange/golden theme with trophy badge
  - **Expired:** Gray theme, "Closed" badge
  - **Urgent (≤3 days):** Red pulsing badge, "Ending Soon"
  - **Active:** Green theme with days remaining
- Click to view raffle details

**FR-RAF-005: Raffle Details Display**
- Professional header card with gradient background
- Display raffle image (if uploaded)
- Show key details:
  - Raffle ID badge
  - Draw date
  - Prize description
  - Ticket cost
- Action buttons: Edit, Export CSV, Back to Raffles

### 3.3 Buyer Management

**FR-BUY-001: Add Buyer**
- **Required Fields:**
  - Name
  - Surname
  - Mobile Number
  - Email Address
  - Number of Tickets
  - Purchase Date (auto-populated)

- **Automatic Processing:**
  - Generate unique buyer number (sequential)
  - Generate random 6-digit ticket numbers (100000-999999)
  - Ensure ticket uniqueness within raffle
  - Set payment status to unpaid by default

**FR-BUY-002: View Buyers**
- Display buyer cards with visual distinction:
  - **Paid:** Green left border, light green gradient
  - **Unpaid:** Orange left border, light orange gradient
  
- **Buyer Card Information:**
  - Avatar with initials
  - Full name and buyer number
  - Payment status badge
  - Contact information (email, mobile)
  - Purchase date
  - Number of tickets
  - All ticket numbers displayed as chips

**FR-BUY-003: Update Payment Status**
- Checkbox toggle for payment received
- Visual feedback on status change
- Enable/disable payment request button
- Update buyer card styling immediately

**FR-BUY-004: Delete Buyer**
- Remove buyer from raffle
- Delete all associated tickets
- Confirmation prompt
- Update ticket pool

**FR-BUY-005: Payment Requests**
- Display payment options modal:
  - **QR Code:** Generate and display QR code for payment link
  - **SMS:** Format and open SMS app with payment details
  - **Email:** Open email client with pre-filled payment request
- Show banking details (if configured)
- Display payment link
- Copy to clipboard functionality

**FR-BUY-006: Buyer Summary Statistics**
- Total buyers count with avatar icon
- Total tickets sold with ticket icon
- Visual cards with gradient backgrounds

### 3.4 Draw System

**FR-DRW-001: Initiate Draw**
- Scroll draw card into view for visibility
- Prompt for screen recording (desktop only)
- Mobile users receive alternative audit suggestions
- Verify paid tickets availability

**FR-DRW-002: Payment Verification**
- Check for unpaid buyers before draw
- Display warning with statistics:
  - Number of unpaid buyers
  - Number of unpaid tickets
  - Total tickets
- Confirm exclusion of unpaid buyers
- Prevent draw if no paid tickets

**FR-DRW-003: Draw Narrative (6 Stages)**

**Stage 1: Introduction (3.5s)**
- Welcome message with party emoji
- **Display prize information in highlighted card**
  - Prize name/description
  - Styled with gradient background and border
  - "TODAY'S PRIZE" label
- Display total tickets and buyers
- Show exclusion count if applicable
- "Preparing the digital draw drum..."

**Stage 2: Shuffle Announcement (2s)**
- Shuffle emoji animation
- "Shuffling All Tickets" message
- Animated progress bar

**Stage 3: Countdown (3s)**
- Large animated numbers: 3, 2, 1
- Each number pulses with animation
- 1 second per number

**Stage 4: Ticket Cycling (3s)**
- Dice emoji
- "Selecting the Winning Ticket..."
- Animated ticket drum with 3D rotation
- Rapid cycling through ticket numbers

**Stage 5: Drumroll (2s)**
- Drum emoji with pulse animation
- "And the winner is..."
- Animated dots loader

**Stage 6: Winner Reveal**
- Celebration burst emoji
- "CONGRATULATIONS!" title with gradient
- Winner announcement
- Winning ticket display (bordered card)
- Contact winner button
- Celebrate again button
- Re-draw button
- Confetti animation (200 pieces)

**FR-DRW-004: Winner Selection Algorithm**
- Filter to paid buyers only
- Collect all tickets from paid buyers
- Random selection using JavaScript Math.random()
- Backend verification and storage
- Update raffle status to drawn
- Store winner information

**FR-DRW-005: Re-Draw Winner**
- Confirmation dialog with warning
- Clear previous winner display
- Reset draw button
- Execute new draw with same payment filtering
- Overwrite previous winner data

**FR-DRW-006: Winner Details Modal**
- Professional modal design with gradient header
- Three information sections:
  - **Personal Info:** Name, email, mobile
  - **Ticket Info:** Winning ticket number, payment status
  - **Prize Info:** Prize description in highlighted card
  
- **Action Buttons:**
  - Send Email (opens email client)
  - Call Winner (opens dialer)
  - Copy Details (clipboard)

**FR-DRW-007: Screen Recording**
- **Desktop Browsers:**
  - Prompt user before draw starts
  - Request screen selection (getDisplayMedia API)
  - Record at 1920x1080, 30fps
  - Support VP9, VP8, or MP4 codecs
  - Capture entire draw process (all 6 stages)
  - Continue 3 seconds post-reveal for celebration
  - Auto-download video file on completion
  - Filename format: `RaffleName_Draw_Recording_YYYY-MM-DDTHH-MM-SS.webm`

- **Mobile Devices:**
  - Detect mobile user agent
  - Inform user of lack of support
  - Suggest alternatives:
    - External device recording
    - Screenshots
    - Third-party screen recorder apps
  - Allow draw to proceed without recording

### 3.5 Export & Reporting

**FR-EXP-001: CSV Export**
- Export button in raffle header
- Generate comprehensive CSV file
- **Included Data:**
  - **Raffle Information:** Name, date, prize, ticket cost, payment link
  - **Summary Statistics:**
    - Total/paid buyers
    - Total/paid tickets
    - Unpaid counts
    - Revenue (paid/pending/potential)
  - **Buyer Details Table:**
    - Buyer number, name, surname
    - Contact information
    - Tickets purchased
    - Payment status
    - Purchase date
    - All ticket numbers

- **CSV Features:**
  - Proper escaping for commas, quotes, newlines
  - UTF-8 encoding
  - Filename: `RaffleName_YYYY-MM-DD.csv`
  - Auto-download to device
  - Visual feedback ("✓ Exported!" message)

### 3.6 Image Management

**FR-IMG-001: Image Upload**
- Accept image files: PNG, JPG, JPEG, GIF, WEBP
- Maximum file size: 16MB
- Validation on file type
- Preview not required (backend processing)

**FR-IMG-002: Thumbnail Generation**
- Automatic creation on upload
- Maximum dimensions: 300x300 pixels
- Maintain aspect ratio
- JPEG format with 85% quality
- RGBA to RGB conversion (white background)
- Optimized file size

**FR-IMG-003: Image Display**
- Show in raffle cards (thumbnail)
- Show in raffle header (full size)
- Fallback if no image uploaded
- Click thumbnail to view raffle

**FR-IMG-004: Image Deletion**
- Delete both full size and thumbnail on raffle update
- Delete on raffle deletion
- Clean up orphaned files

---

## 4. Non-Functional Requirements

### 4.1 Performance

**NFR-PER-001: Response Time**
- Page load: < 2 seconds (first load)
- Page load: < 500ms (cached)
- API responses: < 1 second
- Draw animation: Smooth 60fps
- Image load: < 3 seconds

**NFR-PER-002: Caching Strategy**
- Service Worker with version-based cache
- Network-first for HTML and API calls
- Cache-first for static assets (CSS, JS, images)
- Automatic cache cleanup on version change
- Current cache version: v7

### 4.2 Scalability

**NFR-SCA-001: Data Handling**
- Support up to 100 concurrent raffles
- Support up to 1000 buyers per raffle
- Support up to 10,000 tickets per raffle
- JSON file size monitoring recommended

**NFR-SCA-002: Image Storage**
- Thumbnail optimization reduces bandwidth
- Lazy loading for images
- File system cleanup on deletion

### 4.3 Usability

**NFR-USA-001: Responsive Design**
- Mobile-first approach
- Breakpoints:
  - Mobile: < 768px
  - Tablet: 768px - 1024px
  - Desktop: > 1024px
- Touch-friendly tap targets (minimum 44x44px)
- Smooth scroll behaviors

**NFR-USA-002: Accessibility**
- Semantic HTML structure
- Keyboard navigation support
- Enter key for login
- Clear visual feedback on actions
- Error messages displayed prominently

**NFR-USA-003: User Feedback**
- Loading states on buttons
- Confirmation dialogs for destructive actions
- Success/error alerts
- Animation feedback (confetti, badges)
- Recording indicator during draw

### 4.4 Browser Compatibility

**NFR-COM-001: Desktop Browsers**
- Chrome 90+ (Full support including screen recording)
- Edge 90+ (Full support including screen recording)
- Firefox 88+ (Full support including screen recording)
- Safari 14.1+ (Full support on macOS)

**NFR-COM-002: Mobile Browsers**
- Chrome Mobile (Android)
- Safari Mobile (iOS 14+)
- Samsung Internet
- Limited screen recording support (API not available)

### 4.5 Security

**NFR-SEC-001: Data Protection**
- No encryption (internal use system)
- File system permissions required
- No SQL injection risk (JSON storage)
- XSS prevention through proper escaping

**NFR-SEC-002: Password Storage**
- Hardcoded in JavaScript (not production-secure)
- Suitable for internal/controlled environments
- Recommendation: Implement proper authentication for production

### 4.6 Reliability

**NFR-REL-001: Error Handling**
- Try-catch blocks on all async operations
- User-friendly error messages
- Console logging for debugging
- Graceful degradation on feature failure

**NFR-REL-002: Data Persistence**
- Atomic file writes
- JSON validation on load
- Automatic backup recommendation
- Recovery from corrupt files

### 4.7 Maintainability

**NFR-MAI-001: Code Structure**
- Modular JavaScript functions
- RESTful API design
- Separation of concerns (frontend/backend)
- Commented code sections

**NFR-MAI-002: Configuration**
- Centralized config (config.js)
- Environment-agnostic base URL
- Version control for cache management
- Easy deployment

---

## 5. API Specification

### 5.1 Raffle Endpoints

#### GET /api/raffles
**Description:** Retrieve all raffles
**Response:** Array of raffle objects
```json
[
  {
    "id": "1",
    "name": "Sample Raffle",
    "drawDate": "2025-12-03",
    "prize": "Prize Description",
    "ticketCost": 50.0,
    "paymentLink": "https://payment.link",
    "drawn": false,
    "winner": null,
    "image": "raffle_1.jpg",
    "thumbnail": "raffle_1_thumb.jpg",
    "bankingDetails": { ... }
  }
]
```

#### POST /api/raffles
**Description:** Create new raffle
**Request:** FormData with fields
**Response:** Success message with raffle object

#### GET /api/raffles/{raffle_id}
**Description:** Get specific raffle
**Response:** Single raffle object

#### PUT /api/raffles/{raffle_id}
**Description:** Update raffle details
**Request:** FormData with updated fields
**Response:** Success message with updated raffle

#### DELETE /api/raffles/{raffle_id}
**Description:** Delete raffle
**Response:** Success message

### 5.2 Buyer Endpoints

#### GET /api/buyers/{raffle_id}
**Description:** Get all buyers for raffle
**Response:** Array of buyer objects
```json
[
  {
    "name": "John",
    "surname": "Doe",
    "mobile": "1234567890",
    "email": "john@example.com",
    "tickets": 5,
    "purchaseDate": "2025-10-26",
    "paymentReceived": true,
    "buyerNumber": 1,
    "ticket_numbers": [123456, 234567, 345678, 456789, 567890]
  }
]
```

#### POST /api/buyers/{raffle_id}
**Description:** Add new buyer
**Request:** JSON with buyer details
**Response:** Success message with buyer object

#### GET /api/buyers/{raffle_id}/{buyer_number}
**Description:** Get specific buyer
**Response:** Single buyer object

#### DELETE /api/buyers/{raffle_id}/{buyer_number}
**Description:** Delete buyer
**Response:** Success message

#### POST /api/buyers/{raffle_id}/{buyer_number}/payment
**Description:** Update payment status
**Request:** `{"paymentReceived": true/false}`
**Response:** Success message

### 5.3 Draw Endpoints

#### POST /api/draw/{raffle_id}
**Description:** Execute winner draw
**Logic:** 
- Filter to paid buyers only
- Random selection from paid tickets
- Update raffle with winner and drawn status
**Response:** `{"winner": "Winner: Ticket #123456 - John Doe"}`

#### GET /api/winners/{raffle_id}
**Description:** Get winner details
**Response:**
```json
{
  "name": "John",
  "surname": "Doe",
  "email": "john@example.com",
  "mobile": "1234567890",
  "ticket": 123456
}
```

### 5.4 Payment Endpoints

#### GET /api/payment-qr/{raffle_id}/{buyer_number}
**Description:** Generate payment QR code
**Response:** Base64 encoded QR code image
```json
{
  "qr_code": "data:image/png;base64,..."
}
```

### 5.5 Static File Endpoints

#### GET /uploads/{filename}
**Description:** Serve uploaded images

#### GET /uploads/thumbnails/{filename}
**Description:** Serve thumbnail images

#### GET /manifest.json
**Description:** PWA manifest

#### GET /sw.js
**Description:** Service worker script

#### GET /style.css, /script.js, /config.js
**Description:** Application assets with cache control headers

---

## 6. Data Models

### 6.1 Raffle Object
```json
{
  "id": "string (unique)",
  "name": "string (required)",
  "drawDate": "string (YYYY-MM-DD, required)",
  "prize": "string (required)",
  "ticketCost": "number (required)",
  "paymentLink": "string (URL, required)",
  "drawn": "boolean (default: false)",
  "winner": "string | null",
  "image": "string | null (filename)",
  "thumbnail": "string | null (filename)",
  "bankingDetails": {
    "accountOwner": "string",
    "bankName": "string",
    "branchCode": "string",
    "accountNumber": "string",
    "accountType": "string (Savings|Cheque|Current)"
  }
}
```

### 6.2 Buyer Object
```json
{
  "name": "string (required)",
  "surname": "string (required)",
  "mobile": "string (required)",
  "email": "string (required)",
  "tickets": "number (required, min: 1)",
  "purchaseDate": "string (YYYY-MM-DD, required)",
  "paymentReceived": "boolean (default: false)",
  "buyerNumber": "number (auto-generated, sequential)",
  "ticket_numbers": "array<number> (6-digit random numbers)"
}
```

### 6.3 Raffle Data File Structure
```json
{
  "raffles": [
    { "...raffle object..." }
  ],
  "current_raffle": "string | null (raffle ID)"
}
```

### 6.4 Buyers Data File Structure
```json
{
  "raffle_id_1": [
    { "...buyer object..." }
  ],
  "raffle_id_2": [
    { "...buyer object..." }
  ]
}
```

---

## 7. User Interface Specifications

### 7.1 Login Screen
- **Layout:** Centered modal design
- **Colors:**
  - Background: Purple gradient (#667eea to #764ba2)
  - Card: White with shadow
  - Button: Purple gradient matching background
- **Animations:**
  - Gradient shift (background)
  - Slide-in (card)
  - Bounce (lock icon)
  - Shake (error message)
- **Components:**
  - Lock icon (animated)
  - Title and subtitle
  - Password input with icon
  - Submit button with arrow
  - Error message area
  - Footer hint

### 7.2 Raffle List View
- **Layout:** Grid of raffle cards (responsive)
- **Card Components:**
  - Thumbnail image (if available)
  - Status badge (top-right overlay)
  - Raffle title
  - Days remaining indicator
  - Draw date
  - Prize description
  - Ticket cost
  - Action buttons
- **Color Coding:**
  - Drawn: Orange/golden gradient
  - Expired: Gray
  - Urgent: Red with pulse
  - Active: Green
- **Interactions:**
  - Click card to view details
  - Hover effects (lift and shadow)
  - Delete button (trash icon)

### 7.3 Raffle Detail View
- **Header Card:**
  - Gradient background
  - Large raffle image (left)
  - Raffle details grid (center)
  - Action buttons (right)
  - Responsive stacking on mobile

- **Add Buyer Section:**
  - Form with field groups
  - Validation indicators
  - Submit and clear buttons

- **Buyers List:**
  - Card-based layout
  - Visual payment status
  - Expandable ticket numbers
  - Action buttons per buyer

- **Draw Winner Section:**
  - Dramatic styling (orange gradient)
  - Large centered button
  - Narrative display area
  - Winner reveal area
  - Recording indicator

### 7.4 Modal Dialogs
- **Payment Modal:**
  - Centered overlay
  - Option cards (QR, SMS, Email)
  - Banking details display
  - Cancel button

- **Winner Details Modal:**
  - Large overlay with backdrop blur
  - Three-section layout
  - Action buttons footer
  - Close button (top-right)

### 7.5 Animations
- **Confetti:** 200 colored pieces falling
- **Ticket Cycling:** Rapid number changes with flip animation
- **Countdown:** Large pulsing numbers
- **Status Badges:** Pulsing effect for urgent items
- **Card Hover:** Lift and shadow enhance
- **Button Press:** Scale down effect

### 7.6 Responsive Breakpoints
- **Mobile (< 768px):**
  - Single column layout
  - Stacked form fields
  - Full-width buttons
  - Simplified buyer cards
  - Reduced padding/margins

- **Tablet (768px - 1024px):**
  - Two-column grids
  - Side-by-side forms
  - Optimized spacing

- **Desktop (> 1024px):**
  - Multi-column layouts
  - Maximum content width: 800px
  - Enhanced hover effects
  - Larger text and spacing

---

## 8. Progressive Web App (PWA) Features

### 8.1 Manifest Configuration
```json
{
  "name": "Multi-Raffle System",
  "short_name": "Raffles",
  "description": "A system to manage multiple raffles and their tickets",
  "start_url": "/",
  "display": "standalone",
  "orientation": "any",
  "background_color": "#f5f7fa",
  "theme_color": "#2c5282",
  "icons": [
    {"src": "/icons/icon-192x192.png", "sizes": "192x192", "type": "image/png"},
    {"src": "/icons/icon-512x512.png", "sizes": "512x512", "type": "image/png"}
  ]
}
```

### 8.2 Service Worker Features
- **Version:** 7
- **Cache Name:** `raffle-system-v7`
- **Cached Assets:**
  - `/` (root HTML)
  - `/config.js`
  - `/style.css`
  - `/script.js`
  - `/manifest.json`
  - `/icons/*.png`

- **Strategies:**
  - Network-first for HTML and API
  - Cache-first for static assets
  - Automatic old cache deletion on activate

### 8.3 Installation
- Install prompt available on supported browsers
- Add to home screen capability
- Standalone app experience
- Native-like interface

### 8.4 Offline Capabilities
- Cached pages work offline
- API calls fail gracefully
- User feedback on network status
- Automatic sync when online (not implemented)

---

## 9. Testing Requirements

### 9.1 Functional Testing

**Test Case: TC-001 - User Login**
- Verify correct password grants access
- Verify incorrect password shows error
- Verify Enter key submits form
- Verify password field clears on error

**Test Case: TC-002 - Create Raffle**
- Verify all required fields enforced
- Verify date validation
- Verify image upload and thumbnail creation
- Verify banking details optional fields

**Test Case: TC-003 - Add Buyer**
- Verify ticket number uniqueness
- Verify buyer number sequential assignment
- Verify payment status defaults to unpaid
- Verify email and mobile validation

**Test Case: TC-004 - Draw Winner**
- Verify paid-only ticket filtering
- Verify warning when unpaid tickets exist
- Verify exclusion of unpaid buyers
- Verify random selection
- Verify winner storage and display

**Test Case: TC-005 - Payment Tracking**
- Verify checkbox toggle updates status
- Verify visual feedback on change
- Verify QR code generation
- Verify payment request modals

**Test Case: TC-006 - CSV Export**
- Verify complete data inclusion
- Verify proper CSV formatting
- Verify filename generation
- Verify download initiation

**Test Case: TC-007 - Screen Recording**
- Verify desktop browser prompt
- Verify mobile device detection
- Verify recording capture
- Verify file download and naming

### 9.2 Performance Testing
- Load 50 raffles and measure render time
- Add 500 buyers and measure performance
- Test image upload with 16MB file
- Test draw animation smoothness

### 9.3 Cross-Browser Testing
- Test all features in Chrome, Edge, Firefox, Safari
- Test mobile browsers (Chrome Mobile, Safari Mobile)
- Verify PWA installation on Android and iOS
- Test offline functionality

### 9.4 Security Testing
- Test password bypass attempts
- Test file upload validation
- Test API endpoint access
- Test XSS vulnerabilities

---

## 10. Deployment

### 10.1 Server Requirements
- **Python:** 3.7+
- **Packages:** Flask, Flask-CORS, Pillow, qrcode
- **Storage:** Filesystem access for JSON and images
- **Network:** HTTP server capability

### 10.2 Installation Steps
1. Clone/copy application files
2. Install Python dependencies:
   ```bash
   pip install flask flask-cors pillow qrcode
   ```
3. Create required directories:
   - `uploads/`
   - `uploads/thumbnails/`
   - `icons/` (with icon files)
4. Run Flask application:
   ```bash
   python app.py
   ```
5. Access at `http://localhost:5000`

### 10.3 Configuration
- Update `ACCESS_PASSWORD` in script.js for security
- Configure `CONFIG.baseUrl` for production URL
- Update cache version in sw.js after changes
- Set `app.run(debug=False)` for production

### 10.4 Backup Strategy
- Regular backups of `raffle_data.json`
- Regular backups of `buyers.json`
- Image folder backups
- Recommendation: Daily automated backups

---

## 11. Future Enhancements

### 11.1 Planned Features
- User authentication system (multi-user)
- Database migration (PostgreSQL/MySQL)
- Email automation for payment reminders
- SMS integration for winner notification
- Advanced analytics dashboard
- Ticket sales tracking over time
- Multi-language support
- Dark mode theme

### 11.2 Technical Improvements
- Implement proper authentication (JWT)
- Add unit tests
- Add integration tests
- API rate limiting
- Image CDN integration
- WebSocket for real-time updates
- Backup and restore functionality
- Data export to PDF

---

## 12. Known Limitations

1. **Single User:** No multi-user authentication or role-based access
2. **File Storage:** JSON files have scalability limitations
3. **No Backup:** Manual backup required
4. **Password Security:** Hardcoded password not secure for production
5. **Screen Recording:** Not available on mobile devices (browser limitation)
6. **No Email Server:** External email client required for communications
7. **No SMS Gateway:** External SMS app required for messages
8. **Offline Draw:** Cannot draw winner without internet (API required)
9. **No Undo:** Destructive actions cannot be reversed
10. **Image Size:** Large images may slow down performance

---

## 13. Support & Maintenance

### 13.1 Log Files
- Flask console output for debugging
- Browser console for client-side errors
- Recommendation: Implement file-based logging

### 13.2 Troubleshooting

**Issue: Login not working**
- Check password in script.js
- Clear browser cache
- Check console errors

**Issue: Images not displaying**
- Verify uploads folder exists
- Check file permissions
- Verify image file formats

**Issue: Draw not including paid tickets**
- Verify payment checkbox toggled
- Check buyers.json for paymentReceived field
- Refresh page and try again

**Issue: PWA not installing**
- Verify HTTPS (required for PWA)
- Check manifest.json accessibility
- Clear service worker cache

### 13.3 Maintenance Tasks
- **Weekly:** Review JSON file sizes
- **Monthly:** Clean orphaned image files
- **Quarterly:** Update dependencies
- **Annually:** Review and update security measures

---

## 14. Glossary

- **Raffle:** A fundraising event where numbered tickets are sold and a random ticket is selected as the winner
- **Buyer:** A person who purchases one or more raffle tickets
- **Ticket:** A unique 6-digit number assigned to a buyer, representing their entry in the draw
- **Draw:** The process of randomly selecting a winning ticket
- **PWA:** Progressive Web Application - a web app that can be installed and used like a native app
- **Service Worker:** A script that runs in the background, enabling offline capabilities and caching
- **QR Code:** Quick Response code - a scannable barcode used for payment links
- **CSV:** Comma-Separated Values - a file format for data export
- **Thumbnail:** A smaller, optimized version of an image
- **Draw Narrative:** The six-stage animated process that builds suspense during winner selection
- **Payment Verification:** The process of ensuring only paid ticket holders are included in the draw

---

## 15. Appendices

### Appendix A: File Structure
```
/
├── app.py                  # Flask backend
├── script.js              # Frontend JavaScript
├── style.css              # Styling
├── index.html             # Main HTML
├── config.js              # Configuration
├── sw.js                  # Service Worker
├── manifest.json          # PWA Manifest
├── raffle_data.json       # Raffle data storage
├── buyers.json            # Buyer data storage
├── requirements.txt       # Python dependencies
├── uploads/               # Uploaded images
│   └── thumbnails/        # Generated thumbnails
├── icons/                 # PWA icons
│   ├── icon-192x192.png
│   └── icon-512x512.png
└── SPECIFICATION.md       # This document
```

### Appendix B: Color Palette
- **Primary Purple:** #667eea, #764ba2
- **Success Green:** #48bb78, #38a169
- **Warning Orange:** #f6ad55, #ed8936
- **Error Red:** #e53e3e, #c53030
- **Info Blue:** #4299e1, #3182ce
- **Gray Scale:** #f7fafc, #e2e8f0, #cbd5e0, #718096, #4a5568, #2d3748
- **Drawn Status:** #fef5e7 (background), #f6ad55 (border)

### Appendix C: Icon Set
- 🎪 Raffle/Party
- 🎯 Draw/Target
- 🎲 Random/Dice
- 🎁 Prize
- 💰 Money/Cost
- 📅 Calendar/Date
- 👤 User/Buyer
- 🎫 Ticket
- ✅ Paid/Success
- ⏳ Pending/Waiting
- 🔒 Security/Login
- 📱 Mobile/SMS
- 📧 Email
- 🏆 Winner/Trophy
- 🎉 Celebration
- 🔄 Refresh/Redo
- 📊 Export/Data
- 🔴 Recording

---

**Document End**

*For technical support or feature requests, contact the development team.*
