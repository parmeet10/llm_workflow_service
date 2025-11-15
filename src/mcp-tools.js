import { callOllama } from './llm.js';
import { getWorkflowById } from './database.js'; // assuming you create this function

export async function executeMCPTool(workflowId, inputText) {
  // Fetch workflow from DB
  const workflow = await getWorkflowById(workflowId);

  if (!workflow) {
    throw new Error(`Workflow with ID ${workflowId} not found`);
  }

  if (!workflow.is_active) {
    throw new Error(`Workflow "${workflow.name}" is currently inactive`);
  }

  // Replace placeholder in prompt template
  const prompt = workflow.prompt_template.replace('{{text}}', inputText);

  // Call the LLM with the prompt
  return await callOllama(prompt);
}
