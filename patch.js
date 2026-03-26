const fs = require('fs');
const filepath = 'frontend/src/pages/admin/OfficialDashboardPage.jsx';
let text = fs.readFileSync(filepath, 'utf8');

const replacement = `  async function approveSuggestedWorkflow(suggestion, editedSteps = null, editReason = null) {
    if (!selectedWorkflowComplaint) return;
    try {
      await approveWorkflow(
        selectedWorkflowComplaint.id, 
        suggestion.template_id, 
        suggestion.version_id,
        editedSteps,
        editReason
      );
      toast.success("Workflow approved");
      await loadCore();
      setWorkflowSuggestions([]);
      setSelectedWorkflowComplaint(null);
    } catch {
      toast.error("Failed to approve workflow");
    }
  }`;

text = text.replace(/  async function approveSuggestedWorkflow\(suggestion\) \{[\s\S]*?(?=  async function doReroute\(\))/g, replacement + '\n\n');

fs.writeFileSync(filepath, text);
console.log('done');