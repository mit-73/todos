export const checkIsNsfw = (text, tagsToHide) => {
    if (!tagsToHide || tagsToHide.length === 0) return false;
    const taskTags = (text.match(/#(\w+)/g) || []).map(t => t.substring(1));
    return taskTags.some(taskTag => tagsToHide.includes(taskTag));
};
