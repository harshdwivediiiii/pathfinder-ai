export function generateMarkdownExport(conversation) {
  if (!conversation?.messages) return '';
  let markdown = `# ${conversation.title}\n\n`;

  conversation.messages.forEach((message) => {
    markdown += `## ${message.role}\n\n`;
    markdown += `${message.content}\n\n`;
  });

  return markdown;
}