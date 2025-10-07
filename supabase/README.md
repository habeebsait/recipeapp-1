# Recipe App Setup Instructions

## Supabase Database Setup

### 1. Create a Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new account or sign in
3. Click "New Project"
4. Fill in your project details and create the project

### 2. Run the SQL Scripts

#### Step 1: Create Tables
1. Go to your Supabase dashboard
2. Navigate to "SQL Editor" in the left sidebar
3. Copy and paste the content from `supabase/table_creation.sql`
4. Click "Run" to create all the tables and set up Row Level Security (RLS)

#### Step 2: Insert Dummy Data
1. In the SQL Editor, create a new query
2. Copy and paste the content from `supabase/dummy_data.sql`
3. Click "Run" to insert the sample recipes and categories

### 3. Get Your Supabase Credentials
1. Go to Settings → API in your Supabase dashboard
2. Copy your Project URL and anon key
3. Update `lib/config/supabase_config.dart` with your credentials:

```dart
class SupabaseConfig {
  static const String supabaseUrl = 'YOUR_PROJECT_URL_HERE';
  static const String supabaseAnonKey = 'YOUR_ANON_KEY_HERE';
  
  // ... rest of the configuration
}
```

### 4. Enable Authentication (Optional)
If you want user authentication:
1. Go to Authentication → Settings in Supabase
2. Enable the providers you want (Email, Google, etc.)
3. Configure the authentication settings

## Flutter App Setup

### 1. Install Dependencies
```bash
flutter pub get
```

### 2. Update pubspec.yaml
Make sure you have the Supabase dependency in your `pubspec.yaml`:
```yaml
dependencies:
  supabase_flutter: ^2.7.0
  # ... other dependencies
```

### 3. Initialize Supabase in main.dart
Update your `main.dart` to initialize Supabase:

```dart
import 'package:supabase_flutter/supabase_flutter.dart';
import 'config/supabase_config.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Supabase.initialize(
    url: SupabaseConfig.supabaseUrl,
    anonKey: SupabaseConfig.supabaseAnonKey,
  );

  runApp(MyApp());
}
```

### 4. Run the App
```bash
flutter run
```

## Database Schema

### Tables Created:
- **recipes**: Main recipe information
- **users**: User profiles (linked with Supabase Auth)
- **saved_recipes**: Junction table for user saved recipes
- **recipe_reviews**: User reviews and ratings
- **categories**: Recipe categories

### Key Features:
- Row Level Security (RLS) enabled
- Automatic rating calculation based on reviews
- Full-text search capabilities
- Image URL support
- Ingredient and instruction arrays
- User authentication integration

## Sample Data Included:
- 10 diverse recipes covering different categories
- Recipe categories (Breakfast, Lunch, Dinner, Dessert, etc.)
- Realistic cooking times and difficulty levels
- High-quality Unsplash images
- Proper ingredient lists and step-by-step instructions

## API Endpoints Available:
- Fetch all recipes with filtering and pagination
- Search recipes by name, description, or ingredients
- Get recipes by category
- Save/unsave recipes for users
- Add reviews and ratings
- Get popular and recent recipes

## Environment Variables (Optional)
You can also use environment variables for better security:

Create a `.env` file in your project root:
```
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_anon_key_here
```

Then use the `flutter_dotenv` package to load them.

## Testing the Setup
1. Run the app
2. Browse recipes on the home screen
3. Try searching for recipes
4. Filter by categories
5. View recipe details
6. Save/unsave recipes (requires authentication)

The app will work with the dummy data immediately after running the SQL scripts!
