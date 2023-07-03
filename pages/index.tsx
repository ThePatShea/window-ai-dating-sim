import React, { useState, useEffect, useRef } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import Image from 'next/image';
import Link from 'next/link';
import Head from 'next/head';

import { generateRandomString, sha256, base64URLEncode } from '../helpers/auth';
import getPlayerVariables from '../helpers/getPlayerVariables';
import logConversation from '../helpers/logConversation';
import generateUuid from '../helpers/generateUuid';
import { Message } from '../helpers/interfaces';
import prompt from '../helpers/prompt';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [windowInstalled, setWindowInstalled] = useState<boolean>(false);
  const [sessionId, setSessionId] = useState<string>(generateUuid());
  const [prevMessagesLength, setPrevMessagesLength] = useState<number>(0);
  const [currentModel, setCurrentModel] = useState<string>('');
  const [callbackUrl, setCallbackUrl] = useState<string>('');
  const [openRouterApiKey, setOpenRouterApiKey] = useState<string>('');
  const [codeVerifier, setCodeVerifier] = useState<string>('');
  const [codeChallenge, setCodeChallenge] = useState<string>('');
  
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const aiRef = useRef<any>(null);

  const successRef = useRef<HTMLAudioElement | null>(null);
  const failureRef = useRef<HTMLAudioElement | null>(null);
  const moneyRef = useRef<HTMLAudioElement | null>(null);

  const activeMessages: Message[] = messages.filter(message => message.content !== 'Start Game');

  const playerVariables = getPlayerVariables(activeMessages);

  const handleOpenRouterApiKey = () => {
    setCallbackUrl(window.location.href);

    // Placeholder for setting the open router API key for mobile
    // window.localStorage.setItem("openRouterApiKey", "");

    const existingOpenRouterApiKey = window.localStorage.getItem('openRouterApiKey');

    if (existingOpenRouterApiKey !== 'undefined') {
      setOpenRouterApiKey(existingOpenRouterApiKey || '');
    }

    const code = new URLSearchParams(window.location.search).get('code');

    let currentCodeVerifier: string | null = null;

    const existingCodeVerifier = window.localStorage.getItem('codeVerifier');

    console.log('Existing Code Verifier:', existingCodeVerifier);

    if (existingCodeVerifier && existingCodeVerifier !== 'undefined') {
      setCodeVerifier(existingCodeVerifier || '');
      currentCodeVerifier = existingCodeVerifier;
    } else {
      // Generate a code verifier
      const newCodeVerifier: string = generateRandomString(256);
      window.localStorage.setItem('codeVerifier', newCodeVerifier);
      setCodeVerifier(newCodeVerifier);
      currentCodeVerifier = newCodeVerifier;
    }

    // Hash the code verifier and encode the hash in URL-safe Base64 to generate the code challenge
    sha256(currentCodeVerifier).then(hashedVerifier => {
      const newCodeChallenge = base64URLEncode(hashedVerifier);
      setCodeChallenge(newCodeChallenge);
      console.log('Code Verifier:', currentCodeVerifier);
      console.log('Code Challenge:', newCodeChallenge);
    });

    if (code) {
      fetch("https://openrouter.ai/api/v1/auth/keys", {
        method: 'POST',
        body: JSON.stringify({
          code,
          code_verifier: currentCodeVerifier,
        })
      })
      .then(response => response.json())
      .then(data => {
        if (data.key) {
          window.localStorage.setItem("openRouterApiKey", data.key);
          setOpenRouterApiKey(data.key);
        }
       });
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const playSound = (sound: string) => {
    if (sound === 'success') {
      if (successRef.current) {
        successRef.current.play();
      }
    } else if (sound === 'failure') {
      if (failureRef.current) {
        failureRef.current.play();
      }
    } else if (sound === 'money') {
      if (moneyRef.current) {
        moneyRef.current.play();
      }
    }
  }

  const handleSounds = (messageContent: string) => {
    if (messageContent.indexOf('[+') > -1 || messageContent.indexOf('+]') > -1) {
      playSound('success');
    } 

    if (messageContent.indexOf('[-') > -1 || messageContent.indexOf('-]') > -1) {
      playSound('failure');
    }

    if (messageContent.indexOf('[$') > -1 || messageContent.indexOf('$]') > -1) {
      playSound('money');
    }
  }

  const handleSavedMessages = () => {
    const savedMessagesString: string | null = window.localStorage.getItem("dateCityMessages");
    const savedMessages: Message[] = savedMessagesString ? JSON.parse(savedMessagesString) : '';

    const savedSessionId: string | null = window.localStorage.getItem("dateCitySessionId");

    if (savedMessages) {
      setMessages(savedMessages);
    }

    if (savedSessionId) {
      setSessionId(savedSessionId);
    }
  }

  const resetGame = async () => {
    setInputValue('');
    setMessages([]);
    window.localStorage.setItem("dateCityMessages", JSON.stringify([]));
  };

  const handleSendMessage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const messageInputValue: string = activeMessages.length === 0 ? 'Start Game' : inputValue;
    
    logConversation(sessionId, 'user', messageInputValue, prompt, currentModel);

    if (!messageInputValue) return;

    const newMessage: Message = { role: 'user', content: messageInputValue };

    setMessages((prevMessages) => [...prevMessages, newMessage]);
    setInputValue('');
    setLoading(true);

    let updatedMessages = [...messages, newMessage];

    const streamingOptions = {
      temperature: 1,
      maxTokens: 1000,
      onStreamResult: (result?: { message: Message }, error?: Error) => {
        if (error) {
          toast.error('window.ai streaming completion failed.');
          setLoading(false);
        } else if (result) {
          setLoading(false);

          const lastMessage = updatedMessages[updatedMessages.length - 1];

          if (lastMessage.role === 'user') {
            updatedMessages = [
              ...updatedMessages,
              {
                role: 'assistant',
                content: result.message.content,
              },
            ];
          } else {
            handleSounds(result.message.content);

            updatedMessages = updatedMessages.map((message, index) => {
              if (index === updatedMessages.length - 1) {
                return {
                  ...message,
                  content: message.content + result.message.content,
                };
              }
              return message;
            });
          }

          setMessages(updatedMessages);
        }
      },
    };
    
    if (aiRef.current) {
      try {
        const additionalMessage = await aiRef.current.getCompletion(
          { messages: [{ role: 'system', content: prompt }, ...messages, newMessage] },
          streamingOptions
        );

        const newCurrentModel: string = await aiRef.current.getCurrentModel();
        setCurrentModel(newCurrentModel);

        logConversation(sessionId, 'assistant', additionalMessage.message.content, prompt, newCurrentModel);
      } catch (e) {
        setLoading(false);
        //comment this if not using window.ai onStreamResult - otherwise redudant
        //toast.error('Window.ai completion failed.');
      }
    } else if (openRouterApiKey) {
      const url = 'https://openrouter.ai/api/v1/chat/completions';

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openRouterApiKey}`,
        'HTTP-Referer': callbackUrl,
      };
      const body = JSON.stringify({
        'model': 'openai/gpt-4',
        'messages': [{ role: 'system', content: prompt }, ...messages, newMessage]
      });
      
      fetch(url, {
        method: 'POST',
        headers: headers,
        body: body
      })
      .then(response => response.json())
      .then(data => {
        const result = data.choices[0];

        const lastMessage = updatedMessages[updatedMessages.length - 1];

        setLoading(false);

        updatedMessages = [
          ...updatedMessages,
          {
            role: 'assistant',
            content: result.message.content,
          },
        ];

        handleSounds(result.message.content);

        setMessages(updatedMessages);
      })
      .catch(error => console.error('Error:', error));
    }
  };

  useEffect(() => {
    handleOpenRouterApiKey();
    handleSavedMessages();

    const waitForAI = async () => {
      let timeoutCounter = 0;

      while (!(window as any).ai) {
        await new Promise((resolve) => setTimeout(resolve, 100));

        timeoutCounter += 100;

        if (timeoutCounter >= 1000) {
          toast.custom(
            <div className="bg-blue-500 text-white p-4 rounded-lg shadow-md flex items-center space-x-2">
              <div>Please visit</div>
              <Link
                href="https://windowai.io"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-semibold"
              >
                windowai.io
              </Link>
              <div>to install window.ai</div>
            </div>, {
              id: 'window-ai-not-detected',
            }
          );

          break;
        }
      }

      if ((window as any).ai) {
        aiRef.current = (window as any).ai;

        toast.success('window.ai detected!', {
          id: 'window-ai-detected',
        });

        setWindowInstalled(true);
      }
    };

    waitForAI();
  }, []);

  useEffect(() => {
    if (messages.length < prevMessagesLength) {
      const newSessionId: string = generateUuid();

      window.localStorage.setItem("dateCitySessionId", newSessionId);
      setSessionId(newSessionId);
    } else if (messages.length > 0) {
      window.localStorage.setItem("dateCityMessages", JSON.stringify(messages));
    }

    setPrevMessagesLength(messages.length);
  }, [messages, sessionId, prevMessagesLength]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <>
      <Head>
        <title>DateCity</title>
        <meta property="og:description" content="A dating sim game built on Window.AI" />
        <meta property="og:image" content="https://window-ai-dating-sim.vercel.app/datecity-icon.png" />
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Image src="/datecity-bg-3.jpg" fill={true} alt="DateCity Background" className="fixed z-0 blur-sm"/>
        <div className="w-full sm:w-3/4 lg:w-1/2 xl:w-1/2 shadow-lg rounded-lg p-6 z-10 border-2 border-black relative overflow-hidden">
          <audio className="hidden" ref={successRef} controls>
            <source src={'/sounds/success.wav'} type="audio/wav" />
          </audio>
          <audio className="hidden" ref={failureRef} controls>
            <source src={'/sounds/failure.mp3'} type="audio/mp3" />
          </audio>
          <audio className="hidden" ref={moneyRef} controls>
            <source src={'/sounds/money.mp3'} type="audio/mp3" />
          </audio>
          <div className="bg-rose-200 w-full h-full absolute top-0 left-0 -z-10 opacity-75"></div>
          <h1 className="text-3xl font-bold mb-4 text-center py-1">DateCity</h1>
          <button
            className={`absolute top-1 right-1 border-2 border-black bg-yellow-200 hover:bg-yellow-300 active:bg-yellow-400 text-black px-1 rounded-lg text-md font-semibold`}
            onClick={resetGame}
          >
            New Game
          </button>
          <div className="flex text-center mb-2 rounded-lg border-2 border-black py-1 bg-rose-300">
            <div className="flex-auto border-2 rounded-lg border-black mx-1 bg-purple-300">
              <span className='font-bold'>Day: </span>
              <span className='font-semibold'>{playerVariables.day}/10</span>
            </div>
            <div className="flex-auto border-2 rounded-lg border-black mx-1 bg-cyan-300">
              <span className='font-bold'>HP: </span>
              <span className='font-semibold'>{playerVariables.hp}/100</span>
            </div>
            <div className="flex-auto border-2 rounded-lg border-black mx-1 bg-green-300">
              <span className='font-bold'>Money: </span>
              <span className='font-semibold'>{playerVariables.money}</span>
            </div>
            <div className="flex-auto border-2 rounded-lg border-black mx-1 bg-orange-300">
              <span className='font-bold'>Strength: </span>
              <span className='font-semibold'>{playerVariables.strength}</span>
            </div>
            <div className="flex-auto border-2 rounded-lg border-black mx-1 bg-teal-300">
              <span className='font-bold'>Intelligence: </span>
              <span className='font-semibold'>{playerVariables.intelligence}</span>
            </div>
          </div>
          <div className="overflow-y-auto h-96 mb-4">
            {activeMessages.length === 0 && (
              <div className={`p-2 rounded-lg text-left whitespace-pre-wrap border-2 border-black text-lg font-semibold bg-violet-200 text-black`}>
                <div className='mb-3'>Welcome to DateCity!</div>
                <div className='mb-3'>In this dating sim, you have 10 days to get invited home by someone you are attracted to.</div>
                <div className='mb-3'>In this world, you can go to school, work out at the gym, get a job, shop at the mall, and go to the bar to talk to people.</div>
                <div className='mb-3'>You will need to level up your stats and earn money to become an attractive person who others want to be with.</div>
                <div>DateCity is an infinite world where you can do almost anything. Everything you do will impact your progress toward your goal of getting invited home. If you wish to do something not listed here, simply type it in and watch it happen!</div>
              </div>
            )}
            {activeMessages.map((message, index) => {
              let messageContent: string = message.content;

              if (index === 0) {
                const warningStart: number = message.content.indexOf('<w');
                const warningEnd: number = message.content.indexOf('</warning>');

                if (warningStart > -1 && warningEnd === -1) {
                  messageContent = 'Loading...';
                } else if (warningStart > -1 && warningEnd > -1) {
                  messageContent = messageContent.substring(warningEnd + 12, messageContent.length);
                }
              }

              return (
                <div key={index} className={`mb-2 ${message.role === 'user' ? 'text-right' : ''}`}>
                  <span className={`inline-block p-2 rounded-lg text-left whitespace-pre-wrap border-2 border-black text-lg font-semibold ${message.role === 'user' ? 'bg-sky-200 text-black' : 'bg-violet-200 text-black'}`}>
                    {messageContent}
                  </span>
                </div>
              )
            })}
            <div ref={messagesEndRef}></div>
          </div>
          <form onSubmit={handleSendMessage} className="flex">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className={`flex-grow border-2 border-black bg-sky-200 focus:bg-sky-300 rounded-lg p-2 focus:outline-none text-lg font-semibold ${activeMessages.length === 0 && 'hidden'}`}
            />
            {
              (windowInstalled || openRouterApiKey) && (
                <button
                  type="submit"
                  disabled={loading}
                  className={`${activeMessages.length > 0 ? 'ml-2' : 'mx-auto'} border-2 border-black bg-yellow-200 hover:bg-yellow-300 active:bg-yellow-400 text-black px-4 py-2 rounded-lg text-lg font-semibold ${loading ? 'opacity-50' : ''}`}
                >
                  {loading ? 'Sending...' : activeMessages.length === 0 ? 'Start Game' : 'Send'}
                </button>
              )
            }
          </form>
          {
            (!windowInstalled && !openRouterApiKey) && (
              <>
                <div className="justify-center hidden md:flex">
                  <Link
                    href="https://windowai.io"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline font-semibold"
                  >
                    <button
                      className={`border-2 border-black bg-yellow-200 hover:bg-yellow-300 active:bg-yellow-400 text-black px-4 py-2 rounded-lg text-lg font-semibold`}
                    >
                      Install Window.AI
                    </button>
                  </Link>
                </div>
                <div className="justify-center flex md:hidden">
                  <Link
                    href={`https://openrouter.ai/auth?callback_url=${callbackUrl}&code_challenge=${codeChallenge}&code_challenge_method=S256`}
                    rel="noopener noreferrer"
                    className="underline font-semibold"
                  >
                    <button
                      className={`border-2 border-black bg-yellow-200 hover:bg-yellow-300 active:bg-yellow-400 text-black px-4 py-2 rounded-lg text-lg font-semibold`}
                    >
                      Get API Key
                    </button>
                  </Link>
                </div>
              </>
            )
          }
        </div>
        <Toaster />
      </div>
    </>
  );
};

export default App;