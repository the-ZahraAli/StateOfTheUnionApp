
import 'dotenv/config';
import { Client, GatewayIntentBits } from 'discord.js';
import OpenAI from 'openai';
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
], });
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
const sessions = new Map();
async function startSotuSession(message) {
  const userId = message.author.id;
  sessions.set(userId, {
    step: 1,
    bodyDay: null,
    mindDay: null,
    notes: null,
});
await message.reply(
"**State of the Union** initiated.\n\n 1 What kind of **body day** was it?"
); }
async function generateReport(bodyDay, mindDay, notes) {
  const prompt = `
You are a warm, grounded narrator delivering an "Emotional Weather Report – State of the Union".
Structure:
- Short executive summary using weather metaphors
- Body section
- Mind section
- Notes of significance
- Closing that helps the user put the day to rest
Inputs:
Body day: ${bodyDay}
Mind day: ${mindDay}
Notes: ${notes}
Tone: kind, non-judgmental, slightly playful.
Length: 2–4 short paragraphs.
  `.trim();
  const response = await openai.responses.create({
model: "gpt-5.1-mini",
    input: prompt,
  });
  return response.output_text;
}
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  const userId = message.author.id;
  const content = message.content.trim();
  if (content.toLowerCase() === '!sotu') {
    await startSotuSession(message);
    return;
}
  if (sessions.has(userId)) {
    const session = sessions.get(userId);
    try {
      if (session.step === 1) {
session.bodyDay = content;
session.step = 2;
await message.reply("2 What kind of **mind day** was it?"); return;
}
if (session.step === 2) {
session.mindDay = content;
session.step = 3;
await message.reply("3 What **special things of note** happened today?"); return;
}
      if (session.step === 3) {
        session.notes = content;
        sessions.delete(userId);
await message.reply("Generating your State of the Union report...");
        const report = await generateReport(
          session.bodyDay,
          session.mindDay,
          session.notes
);
        await message.reply(report);
return; }
    } catch (error) {
      console.error(error);
      sessions.delete(userId);
      await message.reply(
"Something went wrong. Please try `!sotu` again later." );
} }
});
client.login(process.env.DISCORD_TOKEN);