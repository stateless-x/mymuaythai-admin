# Trainer Form Data Flow Documentation

This document outlines the data flow for creating and editing a trainer profile using the multi-step form in the `mymuaythai-admin` application.

### Core Components

*   **`TrainerFormMultiStep.tsx`**: The parent component that orchestrates the entire workflow, managing state between steps.
*   **`TrainerFormStep1.tsx`**: The first step, capturing the trainer's basic personal and biographical information.
*   **`TrainerFormStep2.tsx`**: The second step, for managing employment details, province, images, descriptive tags, and specialized classes.

### Backend Services

*   **`trainerService.ts`**: Handles all CRUD operations for trainers, including their related data like tags, images, and classes.
*   **`tagService.ts`**: Used to resolve tag slugs into full tag objects before submission.

---

## 1. Creating a New Trainer

This is the flow for adding a new trainer to the system.

### Step 1: Basic Information (`TrainerFormStep1.tsx`)

1.  **User Action**: The user fills in the trainer's core details:
    *   Name and Bio (in both Thai and English)
    *   Contact Info (Phone, Email, Line ID)
    *   Years of Experience

2.  **Data Structure Passed to Parent (`onNext`)**: When the user clicks "Next," the component passes a clean, partial `Trainer` object to the `TrainerFormMultiStep` parent.

    ```json
    // Data sent from Step 1 to the parent component
    {
      "first_name_th": "สมชาย",
      "last_name_th": "ใจดี",
      "first_name_en": "Somchai",
      "last_name_en": "Jaidee",
      "bio_th": "ประวัติโค้ช...",
      "bio_en": "Coach's bio...",
      "phone": "081-111-2222",
      "email": "somchai.j@example.com",
      "line_id": "somchaij",
      "exp_year": 10
    }
    ```

3.  **`TrainerFormMultiStep.tsx` Action**: The parent component stores this data in its `step1Data` state and renders `TrainerFormStep2`.

### Step 2: Additional Information (`TrainerFormStep2.tsx`)

1.  **User Action**: The user configures the remaining details:
    *   **Employment**: Sets "Freelance" status and selects a Province.
    *   **Images**: Uploads profile images.
    *   **Tags**: Selects descriptive tags (e.g., "Southpaw", "Clinch-Specialist").
    *   **Private Classes**: If the trainer is a freelancer, the user can define custom private classes they offer.
    *   **Account Status**: Sets the trainer's account to active or inactive.

2.  **Data Transformation (Pre-Submission)**: This is a critical step. Before sending the data to the backend, the component transforms the frontend-friendly data into the structure the backend expects.
    *   **Tags**: An array of tag slugs (e.g., `["southpaw", "muay-mat"]`) is converted into an array of full `Tag` objects by calling the `tagService`.
    *   **Classes**: The `privateClasses` array from the form is transformed into a format the `trainerService` can process (renaming keys like `duration` to `duration_minutes` and converting `price` from Baht to Satang).
    *   **Images**: The image list is formatted into an array of objects, each containing an `image_url`.

3.  **User Clicks "Create Trainer"**:
    *   The `handleSubmit` function is called.
    *   It combines the `initialData` (from Step 1) with the new data from Step 2.
    *   It calls the main `onSubmit` prop, sending the complete, transformed data to the backend.

4.  **Final Data Structure Sent to Backend (`trainerService.createTrainer`)**: A single, rich object is sent to the backend.

    ```json
    // Final object sent to trainerService.createTrainer
    {
      // --- From Step 1 ---
      "first_name_th": "สมชาย",
      "last_name_th": "ใจดี",
      "first_name_en": "Somchai",
      "last_name_en": "Jaidee",
      "bio_th": "ประวัติโค้ช...",
      "bio_en": "Coach's bio...",
      "phone": "081-111-2222",
      "email": "somchai.j@example.com",
      "line_id": "somchaij",
      "exp_year": 10,
      
      // --- From Step 2 (and transformed) ---
      "is_freelance": true,
      "province_id": 10, // Example ID
      "is_active": true,
      "images": [
        { "image_url": "https://cdn.bunny.net/path/to/image1.webp" }
      ],
      "tags": [
        { "id": 3, "slug": "southpaw", "name_en": "Southpaw", "name_th": "ถนัดซ้าย" }
      ],
      "classes": [
        {
          "name_th": "คลาสส่วนตัว 1",
          "name_en": "Private Class 1",
          "description_th": "รายละเอียด...",
          "description_en": "Description...",
          "duration_minutes": 60,
          "price": 150000, // 1500 THB in satang
          "max_students": 1,
          "is_active": true,
          "is_private_class": true
        }
      ]
    }
    ```

---

## 2. Editing an Existing Trainer

The editing flow allows for partial saves and follows a similar data aggregation pattern. The key distinction lies in the behavior of the action buttons.

### Step 1: `TrainerFormStep1.tsx` (During Edit)

*   **Initialization**: The form is pre-populated with the existing trainer's data.

*   **Button: "บันทึก" (Save)**
    *   **Goal**: To save the progress on the current step without leaving the form.
    *   **Action**: A `PUT` request is sent to the backend with only the fields from Step 1.
    *   **Result**: The data is saved, the user sees a success message (e.g., a toast notification), and **remains on Step 1**. The form's internal state is automatically updated with the data returned from the save operation, ensuring all fields are in sync. The form dialog does **not** close.

*   **Button: "ถัดไป" (Next)**
    *   **Goal**: To proceed to the next step of the form, carrying over the data from the current step.
    *   **Action**: The component validates the form data and passes it to the parent container. **No API call is made.**
    *   **Result**: The form navigates to **Step 2**, holding the data from Step 1 in its state. The form dialog does **not** close.

### Step 2: `TrainerFormStep2.tsx` (During Edit)

*   **Initialization**: The form is populated with the trainer's existing advanced data.

*   **Button: "บันทึก" (Save)**
    *   **Goal**: This is the final submission button. It saves all changes from both steps and completes the editing process.
    *   **Action**: The component performs the final data transformations (for tags, classes, etc.) and combines the data from both steps. A `PUT` request is sent to the backend with the complete, updated trainer object.
    *   **Result**: The data is saved, the user sees a final success message, and the form dialog **closes**, returning them to the trainer list.

The data structure sent to the backend during the final save is identical in format to the "create" flow, containing all fields required to fully represent the state of the trainer.
