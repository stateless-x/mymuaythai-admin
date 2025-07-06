# Gym Form Data Flow Documentation

This document outlines the data flow for creating and editing a gym profile within the `mymuaythai-admin` application. It details the interactions between the multi-step form components on the frontend and the backend services.

### Core Components & Services

*   **Frontend Components:**
    *   `GymFormMultiStep.tsx`: The main container that controls the flow between steps.
    *   `GymFormStep1.tsx`: The form for collecting basic gym information (name, contact, location, etc.).
    *   `GymFormStep2.tsx`: The form for managing images, descriptive tags, and associated trainers.
*   **Backend Services:**
    *   `gymService.ts`: Handles all CRUD (Create, Read, Update, Delete) operations for gyms.
    *   `tagService.ts`: Provides utility functions for fetching and managing tags.

---

## 1. Creating a New Gym

This flow is initiated when an admin decides to add a new gym to the system. The process is linear, moving from Step 1 to Step 2.

### Step 1: Basic Information (`GymFormStep1.tsx`)

1.  **User Action:** The user fills out the form fields for the gym's fundamental details.
    *   Name (Thai & English)
    *   Contact (Phone, Email, Line ID)
    *   Location (Province, Google Maps URL)
    *   Description (Thai & English)
    *   Status (Active/Inactive)

2.  **State & Data Structure (within `GymFormStep1`):**
    The component maintains a local state object that holds the form data. At this stage, it's a partial `Gym` object.

    ```typescript
    // Example state in GymFormStep1
    const [formData, setFormData] = useState({
      name_th: "สุดยอดมวยไทยยิม",
      name_en: "Ultimate Muay Thai Gym",
      phone: "089-123-4567",
      email: "contact@ultimategym.com",
      description_th: "ยิมมวยไทยใจกลางกรุงเทพ...",
      description_en: "Muay Thai gym in the heart of Bangkok...",
      map_url: "https://maps.app.goo.gl/...",
      youtube_url: undefined,
      line_id: "@ultimategym",
      is_active: true,
      province_id: 1 // (e.g., ID for Bangkok)
    });
    ```

3.  **User Clicks "Next"**:
    *   The `handleNext` function in `GymFormStep1` is triggered.
    *   It performs client-side validation to ensure all required fields are filled.
    *   It calls the `onNext` prop function, passing the cleaned form data up to the `GymFormMultiStep` parent component.

4.  **`GymFormMultiStep.tsx` Action:**
    *   The parent component receives the data from Step 1 and stores it in its own `step1Data` state.
    *   It then updates its `currentStep` state from `1` to `2`, which unmounts `GymFormStep1` and mounts `GymFormStep2`.

### Step 2: Images, Tags, and Trainers (`GymFormStep2.tsx`)

1.  **Initialization:** The component receives the `step1Data` as its `initialData` prop.

2.  **User Action:**
    *   **Images:** The user uploads images using the `ImageUpload` component.
    *   **Tags:** The user selects descriptive tags (e.g., "Air Conditioning", "Free Weights") from the `CollapsibleTagSelector`. These tags are initially stored as an array of slugs (`string[]`).
    *   **Trainers:** The user selects trainers to associate with the gym using the `TrainerSelector`.

3.  **Data Transformation (Pre-Submission):** Before the data is sent to the backend, `GymFormStep2` performs crucial transformations:
    *   **Tag Conversion:** The array of tag slugs (e.g., `['parking-lot', 'private-lessons']`) is converted into full tag objects. The `convertTagSlugsToTagObjects` function iterates through the slugs and calls the `tagService.getAll({ searchTerm: slug })` endpoint for each to fetch the corresponding `Tag` object (`{ id, slug, name_en, name_th }`).
    *   **Trainer IDs:** The component gathers the unique IDs of all selected trainers.

4.  **User Clicks "Create Gym"**:
    *   The `handleSubmit` function is called.
    *   It combines the `initialData` (from Step 1) with the new data collected in Step 2 (images, tags, trainers).

5.  **Final Data Structure & Backend Submission:**
    A single, comprehensive JSON object is assembled and sent via a `POST` request to the `/api/gyms` endpoint, which is handled by `gymService.createGym`. The backend service expects a rich object that includes nested arrays for related data.

    ```json
    // Final object sent to gymService.createGym
    {
      "name_th": "สุดยอดมวยไทยยิม",
      "name_en": "Ultimate Muay Thai Gym",
      "phone": "089-123-4567",
      "email": "contact@ultimategym.com",
      "description_th": "ยิมมวยไทยใจกลางกรุงเทพ...",
      "description_en": "Muay Thai gym in the heart of Bangkok...",
      "map_url": "https://maps.app.goo.gl/...",
      "is_active": true,
      "province_id": 1,
      "images": [
        { "image_url": "https://cdn.bunny.net/path/to/image1.jpg" },
        { "image_url": "https://cdn.bunny.net/path/to/image2.jpg" }
      ],
      "tags": [
        { "id": 5, "slug": "parking-lot", "name_en": "Parking Lot", "name_th": "ที่จอดรถ" },
        { "id": 22, "slug": "private-lessons", "name_en": "Private Lessons", "name_th": "คลาสส่วนตัว" }
      ],
      "associatedTrainers": ["trainer-uuid-abc", "trainer-uuid-def"]
    }
    ```

    The `gymService` processes this request within a single database transaction, creating the gym record and inserting the corresponding entries into the `gymImages`, `gymTags`, and `trainers` tables.

---

## 2. Editing an Existing Gym

The editing flow is more flexible, allowing for partial saves at each step.

### Step 1: `GymFormStep1.tsx`

1.  **Initialization:** The form is pre-populated with the existing gym's data, fetched from the backend.

2.  **User Action & Data Flow (Two Paths):**
    *   **Path A: User clicks "Save"**
        *   This action is for saving changes made *only* on Step 1 without proceeding.
        *   The `handleSave` function is called, which triggers the `onSave` prop.
        *   **Backend Call:** A `PUT` request is sent to `/api/gyms/:id`.
        *   **Data Structure:** A partial `UpdateGymRequest` object containing only the fields from Step 1.
            ```json
            // Partial update from Step 1 "Save"
            {
              "phone": "088-888-8888",
              "line_id": "@new-line-id"
            }
            ```

    *   **Path B: User clicks "Next"**
        *   The `handleNext` function first calls `onSave` to persist the changes from Step 1 (same as Path A). This ensures data is not lost if the user abandons the form on the next step.
        *   After the save is successful, it calls `onNext` to pass the updated data to the `GymFormMultiStep` parent, which then transitions the UI to Step 2.

### Step 2: `GymFormStep2.tsx`

1.  **Initialization:** The form is pre-populated with the existing gym's images, tags, and associated trainers.

2.  **User Action:** The user modifies images, changes tag selections, or adds/removes trainers.

3.  **User Clicks "Save" (Final Save):**
    *   The `handleSubmit` function orchestrates the final update.
    *   It assembles the complete data payload by combining `initialData` with the changes from Step 2.
    *   **Backend Calls:**
        1.  A `PUT` request is sent to `/api/gyms/:id` handled by `gymService.updateGym`. This request updates the gym's core details, images, and tag associations.
        2.  A separate call is made to `batchUpdateTrainerGymAssociations`. The `TrainerSelector` component calculates which trainers were added and which were removed, and this function efficiently updates only those relationships.

4.  **Data Structures for Backend Submission:**
    *   **To `gymService.updateGym`:** A partial `UpdateGymRequest` containing all changed fields from both steps (except trainers, which are handled separately).
        ```json
        // Data for the main update call
        {
          "description_en": "An updated and improved gym description.",
          "images": [ /* final list of image objects */ ],
          "tags": [ /* final list of full tag objects */ ]
        }
        ```
    *   **To `batchUpdateTrainerGymAssociations`:** A specific object detailing only the trainer changes.
        ```json
        // Data for the trainer update call
        {
          "addTrainerIds": ["new-trainer-uuid-xyz"],
          "removeTrainerIds": ["old-trainer-uuid-abc"],
          "gymId": "gym-id-123"
        }
        ```
After a successful save, a success toast is displayed, and the modal is closed, typically triggering a refresh of the gym list to show the updated data.
