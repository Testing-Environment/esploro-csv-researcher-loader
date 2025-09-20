As an Ex Libris Cloud App architect, here is a concise developer’s guide for building a Cloud App that integrates with the Esploro Researchers REST API.1. Authentication and WorkflowAuthentication:API Key: All API calls to the Esploro Researchers REST API must be authenticated using an API key. This key should be included in the Authorization header of your HTTP requests as a bearer token.Permissions: The actions that can be performed via the API are tied to the permissions of the user associated with the API key. Ensure the user has the necessary roles to read, create, update, and delete researcher data.Typical Cloud App Workflow:Initialization: The Cloud App is loaded within an iframe in the Esploro interface.Authentication: The app authenticates with the Esploro API using the provided API key.Data Retrieval: The app makes GET requests to the /esploro/v1/researchers endpoint to fetch a list of researchers or to /esploro/v1/researchers/{researcherId} to get details of a specific researcher.User Interaction: The user interacts with the app's UI to perform actions like searching, creating, editing, or deleting researchers.Data Modification: Based on user actions, the app sends POST, PUT, or DELETE requests to the appropriate endpoints to modify researcher data.UI Update: The app's UI is updated to reflect the changes made.2. Main Researcher Endpoints and Sample CallsHere are the main endpoints for managing researchers, with sample calls in Node.js using the axios library.GET /esploro/v1/researchers: Retrieve a list of researchers.const axios = require('axios');

const getResearchers = async (apiKey) => {
  try {
    const response = await axios.get('[https://api-na.hosted.exlibrisgroup.com/esploro/v1/researchers](https://api-na.hosted.exlibrisgroup.com/esploro/v1/researchers)', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      params: {
        limit: 10,
        offset: 0
      }
    });
    console.log(response.data);
  } catch (error) {
    console.error('Error fetching researchers:', error);
  }
};
GET /esploro/v1/researchers/{researcherId}: Retrieve a specific researcher.const axios = require('axios');

const getResearcherById = async (apiKey, researcherId) => {
  try {
    const response = await axios.get(`https://api-na.hosted.exlibrisgroup.com/esploro/v1/researchers/${researcherId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });
    console.log(response.data);
  } catch (error) {
    console.error(`Error fetching researcher ${researcherId}:`, error);
  }
};
POST /esploro/v1/researchers: Create a new researcher.const axios = require('axios');

const createResearcher = async (apiKey, researcherData) => {
  try {
    const response = await axios.post('[https://api-na.hosted.exlibrisgroup.com/esploro/v1/researchers](https://api-na.hosted.exlibrisgroup.com/esploro/v1/researchers)', researcherData, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    console.log(response.data);
  } catch (error) {
    console.error('Error creating researcher:', error);
  }
};
PUT /esploro/v1/researchers/{researcherId}: Update a researcher.const axios = require('axios');

const updateResearcher = async (apiKey, researcherId, researcherData) => {
  try {
    const response = await axios.put(`https://api-na.hosted.exlibrisgroup.com/esploro/v1/researchers/${researcherId}`, researcherData, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    console.log(response.data);
  } catch (error) {
    console.error(`Error updating researcher ${researcherId}:`, error);
  }
};
DELETE /esploro/v1/researchers/{researcherId}: Delete a researcher.const axios = require('axios');

const deleteResearcher = async (apiKey, researcherId) => {
  try {
    const response = await axios.delete(`https://api-na.hosted.exlibrisgroup.com/esploro/v1/researchers/${researcherId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });
    console.log(`Researcher ${researcherId} deleted successfully. Status:`, response.status);
  } catch (error) {
    console.error(`Error deleting researcher ${researcherId}:`, error);
  }
};
3. Crucial Parameters and FieldsresearcherId (Path Parameter): The unique identifier for a researcher.limit (Query Parameter): The maximum number of results to return.offset (Query Parameter): The number of results to skip for pagination.search filters (Query Parameters): You can filter researchers by various fields like first_name, last_name, email, etc.Request Body Fields:researcher_profile: An object containing the researcher's personal and professional information.user_identifiers: An array of objects for identifiers like ORCID.orcid_integration: An object to manage ORCID integration settings.4. Error HandlingCommon Errors:400 Bad Request: Invalid request body, missing required fields, or invalid date formats.401 Unauthorized: Invalid or missing API key.404 Not Found: The requested researcher ID does not exist.500 Internal Server Error: An error on the Ex Libris server.Recommended Strategies:Implement try-catch blocks in your code to handle potential API errors gracefully.Check the HTTP status code of the response to determine if the request was successful.Parse the error response body for specific error messages and display them to the user.Implement a retry mechanism for transient errors like 500 Internal Server Error.5. UI MappingSearch: A search box in your Cloud App can be mapped to the GET /esploro/v1/researchers endpoint with search filters.Create: A "New Researcher" button can open a form. Submitting this form will trigger a POST /esploro/v1/researchers request.Edit: An "Edit" button next to a researcher in a list can open a form pre-populated with data from GET /esploro/v1/researchers/{researcherId}. Submitting the form will trigger a PUT /esploro/v1/researchers/{researcherId} request.Delete: A "Delete" button can trigger a DELETE /esploro/v1/researchers/{researcherId} request after a confirmation prompt.6. Best PracticesRESTful Principles: Adhere to RESTful principles by using the appropriate HTTP methods (GET, POST, PUT, DELETE) for the corresponding actions.Pagination: Use the limit and offset parameters to paginate through large sets of researchers to improve performance.Error Logging: Implement robust logging to track API requests and responses, which will aid in debugging.Secure API Key Storage: Store your API key securely and do not expose it in client-side code.Efficient Data Fetching: Only fetch the data you need. Avoid making unnecessary API calls.This guide provides a solid foundation for building a Cloud App that integrates with the Esploro Researchers REST API. For more detailed information, always refer to the official Esploro Researchers API documentation.