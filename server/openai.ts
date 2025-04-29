import OpenAI from "openai";

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024. Do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Summary an article
export async function summarizeArticle(
  title: string,
  content: string,
  wordCount: number = 150
): Promise<string> {
  try {
    const prompt = `
      Please summarize the following article in approximately ${wordCount} words.
      Keep the summary concise while maintaining key points and the main message.
      Make it engaging and newspaper-style.
      
      Title: ${title}
      
      Content: ${content}
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 200,
      temperature: 0.5,
    });

    return response.choices[0].message.content?.trim() || "";
  } catch (error) {
    console.error("Error summarizing article:", error);
    throw new Error("Failed to summarize article with OpenAI");
  }
}

// Determine if an article matches user interests
export async function isArticleRelevant(
  title: string,
  content: string,
  topics: string[]
): Promise<{ isRelevant: boolean; relevanceScore: number; matchedTopics: string[] }> {
  try {
    const topicsString = topics.join(", ");
    
    const prompt = `
      Analyze the following article and determine if it matches any of these topics of interest: ${topicsString}.
      
      Title: ${title}
      
      Content: ${content.substring(0, 1000)}...
      
      Respond with JSON in this format:
      {
        "isRelevant": boolean,
        "relevanceScore": number between 0 and 1,
        "matchedTopics": array of matched topics,
        "reasoning": brief explanation
      }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return {
      isRelevant: result.isRelevant || false,
      relevanceScore: result.relevanceScore || 0,
      matchedTopics: result.matchedTopics || []
    };
  } catch (error) {
    console.error("Error checking article relevance:", error);
    throw new Error("Failed to determine article relevance with OpenAI");
  }
}

// Categorize article into the best matching topic
export async function categorizeArticle(
  title: string,
  content: string,
  userTopics: string[]
): Promise<string> {
  try {
    const topicsString = userTopics.join(", ");
    
    const prompt = `
      Categorize the following article into ONE of these topics: ${topicsString}.
      If none match well, choose the closest one or a general category that would fit.
      
      Title: ${title}
      
      Content: ${content.substring(0, 1000)}...
      
      Respond with only the category name.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 20,
      temperature: 0.3,
    });

    return response.choices[0].message.content?.trim() || userTopics[0] || "General";
  } catch (error) {
    console.error("Error categorizing article:", error);
    // Return first topic as fallback
    return userTopics[0] || "General";
  }
}

// Curate articles for a user
export async function curateArticles(
  articles: { title: string; content: string; url: string; source: string }[],
  topics: string[],
  maxArticles: number = 10
): Promise<{ 
  selected: { title: string; content: string; url: string; source: string; category: string }[]; 
  reasoning: string 
}> {
  try {
    const articlesWithNumber = articles.map((article, index) => ({
      id: index + 1,
      title: article.title,
      content: article.content.substring(0, 300) + "...", // truncate for token limit
      url: article.url,
      source: article.source
    }));
    
    const topicsString = topics.join(", ");
    const articlesString = JSON.stringify(articlesWithNumber);
    
    const prompt = `
      You are a newspaper editor curating articles for a personalized Sunday newspaper.
      
      User's topics of interest: ${topicsString}
      
      List of articles:
      ${articlesString}
      
      Select up to ${maxArticles} articles that best match the user's interests.
      Consider article relevance, diversity across topics, and quality.
      
      Respond with JSON in this format:
      {
        "selectedArticles": [array of article IDs],
        "reasoning": brief explanation of your selection,
        "categorization": {articleId: category}
      }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.5,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    const selectedIds = result.selectedArticles || [];
    const categorization = result.categorization || {};
    
    const selectedArticles = selectedIds.map((id: number) => {
      const originalArticle = articles[id - 1];
      return {
        ...originalArticle,
        category: categorization[id] || topics[0] || "General"
      };
    });

    return {
      selected: selectedArticles,
      reasoning: result.reasoning || ""
    };
  } catch (error) {
    console.error("Error curating articles:", error);
    throw new Error("Failed to curate articles with OpenAI");
  }
}
