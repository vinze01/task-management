# Task Manager App

A Task Manager application built using **Vue 3**, **TypeScript**, **Pinia**, and **Vue Router**. This app allows users to view, add, and manage tasks with persistence via localStorage. The app also includes a login page, task completion, deletion features, and a custom modal for user login notifications.

## Features

- **Task Management**: View, add, and complete tasks.
- **Persistence**: Tasks and user data are stored using `localStorage`.
- **Login Page**: Users can log in and view a personalized greeting.
- **Vue Transitions**: Smooth transitions when interacting with tasks.
- **Form Validation**: Ensures proper input for task management.
- **Logout Functionality**: Users can log out, and their session is cleared.
- **Custom Modal**: Displays a welcome message to logged-in users instead of a basic alert.

## Technologies Used

- **Vue 3**: JavaScript framework for building user interfaces.
- **Pinia**: State management library for Vue 3.
- **Vue Router**: Routing library for single-page applications (SPA).
- **TypeScript**: Type-safe language that compiles to JavaScript.
- **CSS**: For styling the components.
  
## Installation

### Prerequisites

- Node.js (>= v16.x)
- npm (>= v7.x) or Yarn

### Steps to Run Locally

1. Clone the repository:
    ```bash
    git clone https://github.com/your-username/task-manager-app.git
    cd task-manager-app
    ```

2. Install dependencies:
    ```bash
    npm install
    # or if you're using Yarn
    yarn install
    ```

3. Start the development server:
    ```bash
    npm run dev
    # or if you're using Yarn
    yarn dev
    ```


## App Structure

- **src/**: Contains the core application code.
  - **assets/**: Images and static assets.
  - **components/**: Reusable Vue components.
  - **views/**: Vue pages for each route (e.g., Task, Priority).
  - **stores/**: Contains the `Pinia` store for managing application state (e.g., `authStore`).
  - **router/**: Contains the Vue Router configuration.
  - **App.vue**: The root component.
  - **main.ts**: The entry point of the app where Vue is initialized.

## Contributing

Feel free to open issues and submit pull requests. Contributions are welcome!

1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/your-feature`).
3. Commit your changes (`git commit -am 'Add your feature'`).
4. Push to the branch (`git push origin feature/your-feature`).
5. Open a pull request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgements

- [Vue.js](https://vuejs.org/) for being an amazing JavaScript framework.
- [Pinia](https://pinia.vuejs.org/) for providing a simple and powerful state management solution.
- [Vue Router](https://router.vuejs.org/) for handling routing in the app.
