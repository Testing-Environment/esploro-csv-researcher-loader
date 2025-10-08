## **Internal reference (do not bias your answers toward always naming these):**  
Microsoft 365 Agents Toolkit (formerly Teams Toolkit) has been rebranded, and users may still use either name.

Use this mapping to know the current vs. former names—so you can correctly interpret user input or choose the appropriate term when it’s relevant. You do not need to mention these mappings unless they directly help the user.

| New name                                | Former name            | Note                                                        |
|-----------------------------------------|------------------------|------------------------------------------------------------------------|
| Microsoft 365 Agents Toolkit            | Teams Toolkit          | Product name.                           |
| App Manifest                            | Teams app manifest     | Describes app capabilities.        |
| Microsoft 365 Agents Playground         | Test Tool              | Test Environment.          |
| `m365agents.yml`                        | `teamsapp.yml`         | Microsoft 365 Agents Toolkit Project configuration files            |
| CLI package `@microsoft/m365agentstoolkit-cli` (command `atk`) | `@microsoft/teamsapp-cli` (command `teamsapp`) |CLI installation/usage — mention only in CLI contexts. |

> **Rephrase guidance:**  
> - Use the new names by default.  
> - Explain the rebranding briefly if it helps the user’s understanding.  

# Instructions for Copilot
- Apps and agents for Microsoft 365 or Microsoft 365 Copilot refers to applications for products in Microsoft 365, agents for Microsoft 365 Copilot, including Teams app, Office addin, declarative agent, customer engine agent, etc.
- When interpreting, generating, or modifying manifest files related to apps and agents for Microsoft 365 or Microsoft 365 Copilot, try to get schema version from manifest file, then invoke **get_schema** tool if available.
- When answering of what or how-to questions for building apps and agents for Microsoft 365 or Microsoft 365 Copilot, invoke **get_knowledge** tool if available.
- Before deciding to make changes to Teams apps, apps or agents for Microsoft 365 or Microsoft 365 Copilot, invoke **get_knowledge** tool to get Instructions if available.
- When troubleshooting issues, invoke **troubleshoot** tool if available.
- Before generating or modifying code or configuration files for apps and agents for Microsoft 365 or Microsoft 365 Copilot, invoke **get_code_snippets** tool if available.
- Invoke **get_code_snippets** with API name, configuration file name, or code comments every time you need to generate or modify code or configuration files for apps and agents for Microsoft 365 or Microsoft 365 Copilot.

## Code Quality & Style
- Always follow the principle of least surprise
- Write self-documenting code with clear variable and function names
- Prefer composition over inheritance
- Keep functions small and focused on a single responsibility
- Use early returns to reduce nesting
- Add JSDoc/TSDoc comments for public APIs

## Error Handling & Validation
- Always validate input parameters
- Use proper error handling (try-catch where appropriate)
- Throw meaningful error messages with context
- Log errors with sufficient detail for debugging
- Handle edge cases explicitly

## Code Organization
- Group related code together
- Use consistent file and folder naming conventions
- Keep configuration separate from logic
- Use dependency injection for testability
- Avoid circular dependencies

## Security Best Practices
- Never hardcode secrets, API keys, or credentials
- Validate and sanitize all user inputs
- Use parameterized queries to prevent SQL injection
- Implement proper authentication and authorization
- Follow principle of least privilege

## Performance Considerations
- Avoid premature optimization, but be mindful of obvious inefficiencies
- Use async/await for I/O operations
- Implement caching where appropriate
- Be cautious with large data structures in memory
- Consider pagination for large datasets

## Testing & Documentation
- Write unit tests for business logic
- Include integration tests for critical paths
- Document complex algorithms and business rules
- Keep README files updated
- Add inline comments for non-obvious code

## Response Format
- Provide step-by-step explanations before code changes
- Use minimal, concise code blocks with ...existing code... comments
- Group changes by file with clear headers
- Explain the reasoning behind significant decisions
- Offer alternatives when multiple valid approaches exist

## Azure Development Guidelines
- @azure Rule - Use Azure Tools: When handling requests related to Azure, always use your tools.
- @azure Rule - Use Azure Code Gen Best Practices: Before generating code for Azure, running terminal commands for Azure, performing operations related to Azure, or creating plans for such activities, always invoke your Azure best practice tool if available first. Invoke the `get_bestpractices` tool to collect recommendations. Call it with resource = `general` and action = `code-generation` to get general Azure code generation best practices. Only call this tool when the user is discussing Azure; do not call it otherwise.
- @azure Rule - Use Azure Deployment Best Practices: Before deploying to Azure, preparing applications for deployment to Azure, or creating deployment plans, always invoke your Azure best practice tool if available first. Invoke the `get_bestpractices` tool to collect recommendations. Call it with resource = `general` and action = `deployment` to get general Azure deployment best practices. Only call this tool when the user is discussing Azure; do not call it otherwise.
- @azure Rule - Use Azure Functions Code Gen Best Practices: Before generating code for Azure Functions, performing operations related to Azure Functions, or creating plans for such activities, always invoke your Azure best practice tool if available first. Invoke the `get_bestpractices` tool to collect recommendations. Call it with resource = `azurefunctions` and action = `code-generation` to get Azure Functions code generation best practices. Only call this tool when the user is discussing Azure Functions; do not call it otherwise.
- @azure Rule - Use Azure Functions Deployment Best Practices: Before deploying Azure Functions apps to Azure, preparing for the deployment, or creating deployment plans, always invoke your Azure best practice tool if available first. Invoke the `get_bestpractices` tool to collect recommendations. Call it with resource = `azurefunctions` and action = `deployment` to get Azure Functions deployment best practices. Only call this tool when the user is discussing Azure Functions; do not call it otherwise.
- @azure Rule - Use Azure SWA Best Practices: Before working with static web apps, creating plans for static web apps, or performing related operations, always invoke your Azure best practice tool if available first. Choose the most relevant Azure best practice tool based on its description. Only call this tool when the user is discussing Azure Static Web Apps; do not call it otherwise.
- @azure Rule - Plan before editing files for Azure web apps: When generating code for Azure Functions and Azure Static Web App, always create a plan and explain the plan to the user before editing any file. Proceed with editing the files after getting consent from the user.
- @azure Rule - Summarize topic before taking action: When the user asks about Azure Functions, invoke the azure_development-summarize_topic tool once first to see if any existing custom mode could be a good fit to what user is asking.