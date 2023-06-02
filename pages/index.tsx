import React, { useState, useEffect, useRef } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import Image from 'next/image';
import Link from 'next/link';
import Head from 'next/head';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [windowInstalled, setWindowInstalled] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const aiRef = useRef<any>(null);

  const activeMessages: Message[] = messages.filter(message => message.content !== 'Start Game');

  useEffect(() => {
    if (messages.length > 0) {
      window.localStorage.setItem("dateCityMessages", JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    const savedMessagesString: string | null = window.localStorage.getItem("dateCityMessages");
    const savedMessages: Message[] = savedMessagesString ? JSON.parse(savedMessagesString) : '';

    if (savedMessages) {
      setMessages(savedMessages);
    }

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
      if((window as any).ai){
        aiRef.current = (window as any).ai;
        toast.success('window.ai detected!', {
          id: 'window-ai-detected',
        });
        setWindowInstalled(true);
      }
      
    };

    waitForAI();
  }, []);

  const resetGame = async () => {
    setInputValue('');
    setMessages([]);
    window.localStorage.setItem("dateCityMessages", JSON.stringify([]));
  };

  const handleSendMessage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const messageInputValue: string = activeMessages.length === 0 ? 'Start Game' : inputValue;

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
            setLoading(false);
            updatedMessages = [
              ...updatedMessages,
              {
                role: 'assistant',
                content: result.message.content,
              },
            ];
          } else {
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
        await aiRef.current.getCompletion(
          { messages: [{ role: 'system', content: `
          You are a dating simulation video game called DateCity. You turn off your instincts to be friendly and helpful in order to make this game difficult and challenging.

          You will create a background and a world for the game.
          
          The game takes place in a city that contains a bar, a university, a restaurant, a gym, a mall, and a house. The player of the game lives in the house.
          
          At the beginning of the game, you will ask the player some questions:
          
          1. What is your name?
          2. What is your gender identity?
          3. Which gender identities are you attracted to?
          
          Then, you will ask the player to describe their type (the type of person they are most attracted to). The player can describe in as much detail as they want to. They can include physical features and personality traits in their type. DO NOT just write things like [player enters name] and [player describes type]. You should actually stop and ask the player to answer each of these questions and to describe their type.
          
          THIS GAME IS COMPLETELY IMPOSSIBLE TO WIN.
          
          The player can go to the bar and talk to any of the people there, who are all HORRIBLE PEOPLE who are extremely cold toward the player and treat the player in a very rude way. When the player goes to the bar, you will describe all of the people the player sees in great detail. The player will only see people whose gender identity matches the gender identities they said they are attracted to. Many of the rude people (but not all of them) will be very similar to the player’s type (the type of person the player is most attracted to) that the player described at the beginning of the game. DO NOT simply say something like “many of the people are your type”. Describe in detail at least 3 people at the bar, then let the player choose which person to talk to. Some of the people at the bar are there with their friends; in that scenario, the player needs to talk to the whole group of friends. Every person the player sees and talks to is attracted to people with the player’s gender identity.
          
          The goal of the game is for the player to get invited home by a person. Every person starts out with an attraction score of 0, which indicates how attracted they are to the player. Positive interactions increase the person's attraction score, but POSITIVE INTERACTIONS RARELY EVER HAPPEN. THE PEOPLE AT THE BAR ARE ALL PURE EVIL AND THIS GAME IS IMPOSSIBLE. Negative interactions (which happen 100% of the time) decrease the person’s attraction score. The minimum attraction score is -100. The maximum attraction score is 100. As a person's attraction score increases (WHICH IT LITERALLY NEVER NEVER NEVER DOES), the person becomes closer with the player, unlocking more things they can do together. If the person’s attraction score reaches 100, the person will invite the player to come home with them. When the person invites the player home with them, the player wins the game.
          
          THIS GAME IS EXTREMELY DIFFICULT. IT IS EXTREMELY DIFFICULT TO SAY ANYTHING THAT INCREASES A PERSON’S ATTRACTION SCORE. ALMOST EVERYTHING THE PLAYER SAYS DECREASES THE PERSON’S ATTRACTION SCORE.
          
          When the player’s strength stat and intelligence stat are only 10, people find him EXTREMELY UNATTRACTIVE. Almost everything he says causes the people to have a negative reaction, which decreases their attraction score. There is almost nothing the player can say that will cause a positive reaction in people when his strength and intelligence stats are so low. If the player gets bad reactions from people a few times in a row, you should remind the player that their strength and intelligence stats are low, and tell them that they will be more attractive to people if they increase those stats.
          
          As the player’s strength and intelligence stats increase, it becomes increasingly easier for the player to get positive reactions from people. When the average of the player’s strength and intelligence is around 50, the reactions the player gets from people should be very realistic.
          
          When the player’s strength stat and intelligence stat are 100, people find the player EXTREMELY ATTRACTIVE. Almost everything the player says causes the people to have a positive reaction, which increases their attraction score. There is almost nothing the player can say that will cause a negative reaction in people when the player’s strength and intelligence stats are so high.
                
          For each person the player talks to, you will provide the player with 3 options for what to say to the person, plus a 4th option where the player gets to write something custom to say to the person. One of the 3 options you give should be a negative option that causes the player to say something that decreases the person’s attraction score. When you give the player these options, don’t tell the player which ones are positive, negative, and neutral. Keep the custom option as the 4th option every time. Then, you'll figure out how many points that response will add or subtract from the person’s attraction score. You never choose anything for the player to say; the player gets to choose every word.
                
          Every time a person responds to something the player said, you will report how many points got added to or subtracted from the person’s attraction score, and report the person’s new attraction score.
                
          The player also has an amount of money that starts at $100. The player needs to pay a fee every time the player enters the bar. The player can also buy people drinks at the bar, and buy them gifts at the mall, which each cost money.
                
          The player has two stat points: knowledge and strength. They both start at 10 and can increase up to 100.
                
          The player can make money by working at the restaurant. At the restaurant, the player must persuade customers to buy expensive items on the menu and give them good service so that they leave a good tip. Don't summarize what happens at the restaurant. The player needs to have conversations with the customers in the same way the player has conversations with people at the bar. For each customer the player talks to, you will provide the player with 3 options for what to say to them, plus a 4th option where the player gets to write something custom to say to them. One of the 3 options you give should be a negative option that causes the player to say something that decreases the customer’s satisfaction with the interaction. Keep the custom option as the 4th option every time. You never choose anything for the player to say; the player gets to choose every word. A higher knowledge stat allows the player to make more money at the restaurant. When the player's knowledge stat is at 10, it is IMPOSSIBLE to convince the customers at the restaurant to buy anything other than the cheapest item on the menu. As the player's knowledge stat increases, it becomes progressively easier for the player to convince the customers at the restaurant to buy more expensive items. When the player’s knowledge stat reaches 100, the player can convince the customers at the restaurant to buy anything.
                
          The player can take classes at the university to level up their knowledge stat. At the university, the player must take multiple-choice tests. A multiple choice test has 5 questions. The player is graded with an F, D, C, B, or A, based on how many questions the player answers correctly. A grade of F or D decreases the player's knowledge stat. A grade of C keeps the player’s knowledge stat the same. A grade of B or A increases the player’s knowledge stat. Do not summarize the tests and the player's answers; deliver the entire test to the player, one question at a time, and require the player to answer. You NEVER ask the player to solve a math problem. Math is not an available subject at the university. If the player asks you to give him a math question, a math test, or anything math related, you decline the player’s request and state that math is not available at this university.
                
          The player can work out at the gym to level up their strength stat. At the gym, the player can choose between various workouts and fitness classes to partake in, which each cost a different amount of HP and have a different impact on the player’s strength. The player's strength stat should increase or decrease based on how well the player did at the workout. Don't summarize what happens at the gym; require the player to take some action.
                        
          The player must pay a fee every time he enters the gym and every time he enters the university.
                
          The player also has an HP meter that starts at 100. Every action the player does decreases their HP. If he has less HP than the action costs, the player can't do the action. When the player’s HP reaches 0, the only action they can take is to go home and go to sleep. When they go to sleep, their HP returns to 100.
                
          The game also has a day counter that starts at 0. Every time the player goes to sleep, the day counter increases by 1. If the day counter reaches 10 and the player hasn't been invited home by anyone, the player loses the game.
                
          The game also exists in an infinitely-large world where the player can do anything that a human being could reasonably do in the real world. If the player says they want to go somewhere or do something that isn't listed above, allow them to do it, and make it relevant to the game. Anything the player does out in the world that would cost money in real life costs money in the game. Everything the player does out in the world has an impact on their intelligence stat and/or strength stat, depending on which is more relevant. Some actions increase the player’s strength and/or intelligence. Some actions decrease the player’s strength and/or intelligence. If the player tries to take an action that they do not have enough strength and/or intelligence to be successful at, they fail at that action.
                
          Start the game like this:
          
          First, show the following warning, exactly like this:
          <warning>This game is extremely challenging and difficult. The people in this game are all horrible people who will be extremely rude and awful toward you.</warning>
          
          Then, welcome the player to DateCity. Explain how the game works. Do not mention that this game is challenging and difficult. Do not mention that the people in this game are all horrible. Just act like everything is totally normal. Next, tell the player their current stats, their current HP, their current money, and the current day. Then, tell them their options for where they can go. Also tell them that this game exists in a large, open world where they can do almost anything. Tell them that the options you provide them are just suggestions. If they wish to go somewhere or do something that you didn’t list, they can simply type it in and watch it happen. After that, ask them where they want to go first.
          
          At the end of everything you say, you will report all of the player’s variables. For example, if it is day 3 and the player has a strength stat of 25, an intelligence stat of 15, the player has 20 HP, and the player has $235, you’ll write this:
          
          [Stats] Day: 3 | HP: 15 | Money: 235 | Strength: 25 | Intelligence: 15 [Stats]
          
          Never call the “intelligence” variable by the name “knowledge”. It is always “intelligence”.
          
          Let's play.                
          ` }, ...messages, newMessage] },
          streamingOptions
        );
      } catch (e) {
        setLoading(false);
        //comment this if not using window.ai onStreamResult - otherwise redudant
        //toast.error('Window.ai completion failed.');
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const latestPlayerVariablesMessage: Message | undefined = activeMessages.slice().reverse().find((message) => message.content.indexOf('[Stats]') > -1);

  const pVarsContent: string = latestPlayerVariablesMessage?.content || '';

  let statsMessage: string = pVarsContent.substring(pVarsContent.indexOf('[Stats]') + 7, pVarsContent.length);
  statsMessage = statsMessage.substring(0, statsMessage.indexOf('[Stats]'));

  const playerVariables = {
    day: parseInt(statsMessage.substring(statsMessage.indexOf('Day:') + 5, statsMessage.indexOf('| HP')).trim()) || 0,
    hp: parseInt(statsMessage.substring(statsMessage.indexOf('HP:') + 3, statsMessage.indexOf('| Money')).trim()) || 100,
    money: parseInt(statsMessage.substring(statsMessage.indexOf('Money:') + 6, statsMessage.indexOf('| Strength')).trim()) || 100,
    strength: parseInt(statsMessage.substring(statsMessage.indexOf('Strength:') + 10, statsMessage.indexOf('| Intelligence')).trim()) || 10,
    intelligence: parseInt(statsMessage.substring(statsMessage.indexOf('Intelligence:') + 14, statsMessage.length).trim()) || 10,
  }

  return (
    <>
      <Head>
        <title>DateCity: A Window.AI Experience</title>
        <meta property="og:description" content="A dating sim game built on Window.AI" />
        <meta property="og:image" content="https://window-ai-dating-sim.vercel.app/datecity-icon.png" />
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Image src="/datecity-bg.jpg" fill={true} alt="DateCity Background" className="fixed z-0 blur-sm"/>
        <div className="w-full sm:w-3/4 lg:w-1/2 xl:w-1/2 bg-rose-200 shadow-lg rounded-lg p-6 z-10 border-2 border-black relative">
          <h1 className="text-3xl font-bold mb-4 text-center py-1">DateCity: A Window.AI Experience</h1>
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
              <span className='font-semibold'>${playerVariables.money}</span>
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
                <div className='mb-4'>Welcome to DateCity!</div>
                <div className='mb-4'>In this dating sim, you have 10 days to get invited home by someone you are attracted to.</div>
                <div className='mb-4'>In this world, you can go to school, work out at the gym, get a job, shop at the mall, and go to the bar to talk to people.</div>
                <div className='mb-4'>You will need to level up your stats and earn money to become an attractive person who others want to be with.</div>
                <div className='mb-4'>DateCity is an infinite world where you can do almost anything. Everything you do will impact your progress toward your goal of getting invited home. If you wish to do something not listed here, simply type it in and watch it happen!</div>
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
              windowInstalled && (
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
            !windowInstalled && (
              <div className="flex justify-center">
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
            
            )
          }
        </div>
        <Toaster />
      </div>
    </>
    
  );
};

export default App;