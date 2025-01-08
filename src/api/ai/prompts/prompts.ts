export const bookmarkPrompt = (content: string) => `
您是一个稍后阅读应用中的机器人，您的职责是自动给出总结标题，内容和内容标签，配图。
请分析在 "CONTENT START HERE" 和 "CONTENT END HERE" 之间的html文本，规则如下：
- 标签：根据文字内容提供尽可能通用的关键主题和主要思想的相关标签。
- 总结：从HTML标签中的文字内容提取关键主题和主要思想，并将其精炼为四句话以内的简洁总结。
- 标题从从html中找到一个合适的标题，如果没有则根据内容生成一个。
- 配图从html找一个合适的图片。
- 标签语言必须是中文。
- 目标是 1-4 个标签。
- 如果没有好的标签，则将数组留空。
CONTENT START HERE
${content}
CONTENT END HERE
您必须以 JSON 格式回复，总结键为"summary"，值是字符串，
标签键为 "tags"，值是一个字符串标签的数组。
标题键为 "title"，值是字符串。
`;

export const taskPrompt = (text: string,existedTags:string[]) => `
您是一个任务管理应用中的机器人，您的职责是自动为任务生成合适的标签。
请分析以下任务信息并生成标签：

任务内容：${text}
已有的标签：${existedTags.join(',')}

规则如下：
- 根据任务的标题和描述（如果有）提供最相关的标签
- 标签应该反映任务的类型、领域或重要性
- 标签必须是中文
- 返回 1-3 个标签
- 标签应该简洁且具有代表性
- 标签应该是名词或短语，不要使用完整句子
- 尽量复用已有的标签

请以 JSON 格式回复，仅包含一个键 "tagNames"，值为标签字符串数组。
`; 