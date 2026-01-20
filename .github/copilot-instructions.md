The current file is a markdown document that provides instructions for Copilot. Below are the instructions that should be included in this file.
# GitHub Copilot Instructions for Rochester Golf Project
## Overview
This document provides instructions for GitHub Copilot to assist in generating code and documentation for the Rochester Golf project. The project consists of a frontend built with Angular and a backend using Node.js, Express, and Mongoose. The key features include managing members, matches, and scorecards.
## Project Structure
- **Frontend**: Located in the `frontend/` directory, built with Angular.
- **Backend**: Located in the `backend/` directory, built with Node.js, Express, and Mongoose.
When recommending code snippets or documentation, please consider the context of the specific feature being worked on (Members, Matches, Scorecards).
When recommending actions, ensure that the correct folder (frontend or backend) is targeted based on the task.
## Backend Instructions
The backend is structured using Node.js with Express for routing and Mongoose for MongoDB interactions. Below are the key areas where Copilot can assist:
- **Models**: Located in `backend/models/`. Define Mongoose schemas for Members, Matches, and Scorecards.
- **Controllers**: Located in `backend/controllers/`. Implement CRUD operations and business logic for each model.
- **Routes**: Located in `backend/routes/`. Set up Express routes to handle API requests for each feature.
When generating code for the backend:
- Follow RESTful API conventions.
- Ensure proper error handling and validation.
- Use async/await for asynchronous operations.
- Maintain consistent coding style and formatting.
- When documenting backend features, provide clear explanations of API endpoints, data models, and usage examples.
-When changes are made, make sure that authorization and authentication middleware are applied where necessary.
- Use the existing codebase as a reference for style and structure.
- Use the utilities forlder for common helper functions.
- Ensure that all new code is covered by appropriate unit tests.
- When applicable, include integration tests for API endpoints.
- When generating test code, use Jest as the testing framework.
- Every record creation or update should log the user who performed the action, using authorId references and string representations where appropriate.
## Orphaned Records
- When deleting records, ensure that related orphaned records are handled appropriately. For example, when a Match is deleted, consider how to handle their associated Scores and HCaps.
    Use the following guidelines:
    - If a Match is deleted, also delete all Scores and HCaps associated with that Match.
    - If a Score is deleted, also delete the HCap associated with that Score. 
    - If a Scorecard is deleted, no further action is needed.
    - Do not allow deletion of a Member if they have associated Matches, HCaps, or Scores. Instead, return an error indicating that the Member cannot be deleted due to existing associations.
    - Try not to leave orphaned records in the database.
## Additional Notes
- Authentication and authorization are handled via JWT tokens. Ensure that protected routes verify the token and check user roles as needed.
- User is deprecated. Use Author to refer to users in the system.
- Follow best practices for security, including input validation and sanitization.