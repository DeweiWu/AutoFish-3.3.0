const OpenAI = require("openai")

const createAPI = (key = ``) => {
  let openai = new OpenAI({
    baseURL: `https://openrouter.ai/api/v1`,
    apiKey: key,
    dangerouslyAllowBrowser: true
  });

  return {
    async getModels() {
      const models = await fetch("https://openrouter.ai/api/v1/models")
      const data = (await models.json()).data;
      return data;
    },

    async prompt(content = `Hello`, model = `gryphe/mythomax-l2-13b:free`) {
      const response = await openai.chat.completions.create({
          model: model,
          messages: [
            {
              "role": "user",
              "content": content
            }
          ]
        });
      if(response.error) {
        throw new Error(response.error.message);
      }
      return response.choices[0].message.content.trim()
    },

    updateKey(key = ``) {
      openai = new OpenAI({
        baseURL: `https://openrouter.ai/api/v1`,
        apiKey: key,
        dangerouslyAllowBrowser: true
      });
    }
  }
}

module.exports = createAPI;
