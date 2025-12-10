import { inngest } from "@/lib/inngest/client";
import {NEWS_SUMMARY_EMAIL_PROMPT, PERSONALIZED_WELCOME_EMAIL_PROMPT} from "@/lib/inngest/prompts";
import {sendNewsSummaryEmail, sendWelcomeEmail} from "@/lib/nodemailer";
import { getAllUsersForNewsEmail } from "@/lib/actions/user.actions";
import { getWatchlistSymbolsByEmail } from "@/lib/actions/watchlist.actions";
import { getNews } from "@/lib/actions/finnhub.actions";
import {formatDateToday} from "@/lib/utils";

export const sendSignUpEmail = inngest.createFunction(
  { id: 'sign-up-email' },
  { event: 'app/user.created' },
  async ({ event, step }) => {
    const userProfile = `
            - Country: ${event.data.country}
            - Investment goals: ${event.data.investmentGoals}
            - Risk tolerance: ${event.data.riskTolerance}
            - Preferred industry: ${event.data.preferredIndustry}
        `;

    const prompt = PERSONALIZED_WELCOME_EMAIL_PROMPT.replace('{{userProfile}}', userProfile);

    const response = await step.ai.infer('generate-welcome-intro', {
      model: step.ai.models.gemini({ model: 'gemini-2.5-flash-lite' }),
      body: {
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
      },
    });

    await step.run('send-welcome-email', async () => {
      const part = response.candidates?.[0]?.content?.parts?.[0];
      const introText = (part && 'text' in part ? (part as any).text : '') ||
        'Thanks for joining Signalist. You can start trading now.';

      const { data: { email, name } } = event as any;
      return await sendWelcomeEmail({ email, name, intro: introText });
    });

    return {
      success: true,
      message: 'Welcome email sent!'
    } as const;
  }
);

export const sendDailyNewsSummary = inngest.createFunction(
    { id: "daily-news-summary" },
    [{ event: "app/send.daily.news" }, { cron: "0 12 * * *" }], // run once daily at 12:00
    async ({ step }) => {
        // Step 1: Get all users
        const users = await step.run("get-all-users", getAllUsersForNewsEmail);
        if (!users?.length) return { success: true, message: "No users found." };

        // Step 2: Fetch news per user
        const perUserNews = await step.run("fetch-news-per-user", async () => {
            const results: {
                email: string;
                name: string;
                news: MarketNewsArticle[];
            }[] = [];

            for (const user of users as { email: string; name: string }[]) {
                const symbols = await getWatchlistSymbolsByEmail(user.email);

                let news: MarketNewsArticle[] = [];
                try {
                    news = await getNews(symbols);
                } catch {
                    try {
                        news = await getNews(); // fallback
                    } catch {
                        news = [];
                    }
                }

                results.push({
                    email: user.email,
                    name: user.name,
                    news: news.slice(0, 6),
                });
            }

            return results;
        });

        // Step 3: Summaries
        const userNewsSummaries: {
            user: { email: string; name: string };
            newsContent: string | null;
        }[] = [];

        for (const { email, name, news } of perUserNews) {
            try {
                const prompt = NEWS_SUMMARY_EMAIL_PROMPT.replace(
                    "{{newsData}}",
                    JSON.stringify(news, null, 2)
                );

                const response = await step.ai.infer(`summarize-news-${email}`, {
                    model: step.ai.models.gemini({ model: "gemini-2.5-flash-lite" }),
                    body: {
                        contents: [{ role: "user", parts: [{ text: prompt }] }],
                    },
                });

                const part = response.candidates?.[0]?.content?.parts?.[0];
                const newsContent =
                    (part && "text" in part ? part.text : null) || "No market news.";

                userNewsSummaries.push({
                    user: { email, name },
                    newsContent,
                });
            } catch (err) {
                console.error("Failed to summarize news for:", email);
                userNewsSummaries.push({
                    user: { email, name },
                    newsContent: null,
                });
            }
        }

        // Step 4: Send emails
        await step.run("send-news-emails", async () => {
            return Promise.all(
                userNewsSummaries.map(({ user, newsContent }) => {
                    if (!newsContent) return;

                    return sendNewsSummaryEmail({
                        email: user.email,
                        date: formatDateToday,
                        newsContent,
                    });
                })
            );
        });

        return {
            success: true,
            message: "Daily news summary emails sent successfully",
        };
    }
);
