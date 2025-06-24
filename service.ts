        stream: (input) =>
          Effect.gen(function* () {
            const model = getProviderModel(config);
            const messages = toHistoryMessages(input);
            
            console.log(`[AgentService] Stream request for ${config.provider}:`, {
              model: config.model,
              messagesCount: messages.length,
            });
            
            if (config.provider === "google") {
              // PROVEN FIX: For Gemini, use generateText (non-streaming) due to streaming issues
              // Community reports that streaming often fails or returns empty chunks
              console.log("[AgentService] Using non-streaming approach for Gemini due to known streaming issues");
              
              const result = yield* Effect.tryPromise({
                try: () => generateText({ model, messages }),
                catch: mapVercelError,
              });
              
              console.log(`[AgentService] Gemini generateText result:`, {
                hasText: !!result.text,
                textLength: result.text?.length || 0,
                usage: result.usage,
              });
              
              if (!result.text || result.text.trim() === "") {
                console.warn("[AgentService] Gemini returned empty response, this is a known API issue");
                return Stream.make<AgentStreamChunk>({ 
                  content: "Sorry, Gemini API returned an empty response. This is a known issue with the Gemini API. Please try again." 
                });
              }
              
              return Stream.make<AgentStreamChunk>({ content: result.text });
            } else {
              // OpenAI/Anthropic: use streaming (these providers have reliable streaming)
              const stream = yield* Effect.tryPromise({
                try: () => streamText({ model, messages }),
                catch: mapVercelError,
              });
              
              return Stream.async<AgentStreamChunk, AgentServiceError>(
                (emit) => {
                  (async () => {
                    try {
                      let chunkCount = 0;
                      let totalContent = "";
                      
                      for await (const delta of stream.textStream) {
                        chunkCount++;
                        totalContent += delta;
                        console.log(`[AgentService] ${config.provider} chunk ${chunkCount}:`, delta.substring(0, 50) + "...");
                        emit.single({ content: delta });
                      }
                      
                      console.log(`[AgentService] ${config.provider} streaming completed:`, {
                        chunks: chunkCount,
                        totalLength: totalContent.length,
                      });
                      
                      if (chunkCount === 0) {
                        console.warn(`[AgentService] No chunks received for ${config.provider}`);
                        emit.single({ content: `No response received from ${config.provider}. Please try again.` });
                      }
                      
                      emit.end();
                    } catch (error) {
                      console.error(`[AgentService] ${config.provider} stream error:`, error);
                      emit.fail(mapVercelError(error));
                    }
                  })();
                },
              );
            }
          }).pipe(Stream.unwrap), 