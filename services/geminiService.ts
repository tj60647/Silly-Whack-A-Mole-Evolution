
import { GoogleGenAI, Type } from "@google/genai";
import { THEMES } from "../constants";

export const generateLevelContent = async (level: number) => {
  // Always use the process.env.API_KEY directly when initializing
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Pick a random theme or progress through THEMES array
  const themeIndex = (level - 1) % THEMES.length;
  const theme = THEMES[themeIndex];

  // Generate metadata
  const textResponse = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate level metadata for Level ${level} of a wacky Whack-A-Mole game. 
    Theme: ${theme}. 
    I need: 
    1. A funny name for the "mole" replacement (e.g. "The Synergy Snatcher" for Corporate).
    2. A short, silly level intro text.
    3. A goofy one-liner catchphrase the mole says when it pops up.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          moleName: { type: Type.STRING },
          intro: { type: Type.STRING },
          catchphrase: { type: Type.STRING },
        },
        required: ["moleName", "intro", "catchphrase"]
      }
    }
  });

  const metadata = JSON.parse(textResponse.text);

  // Generate Image
  const imagePrompt = `A single silly ${metadata.moleName} character from the theme "${theme}" popping out of a generic brown mound or hole. Professional 2D cartoon sticker style, vibrant colors, clean thick outlines, isolated on a simple solid bright green background. No complex details, very goofy expression.`;
  
  const imageResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ text: imagePrompt }] },
    config: {
      imageConfig: {
        aspectRatio: "1:1",
      }
    }
  });

  let imageUrl = "https://picsum.photos/200/200?random=1";
  for (const part of imageResponse.candidates[0].content.parts) {
    if (part.inlineData) {
      imageUrl = `data:image/png;base64,${part.inlineData.data}`;
    }
  }

  return {
    ...metadata,
    theme,
    moleImageUrl: imageUrl
  };
};