import * as React from 'react';
import { LuBot } from 'react-icons/lu';
import Markdown from 'react-markdown';
import useChatScroll from '../hooks/useChatScroll';
import useChatbot from '../hooks/useChatbot';
import { generate } from '@pdfme/generator';
import { pdfTemplate } from '../pdf/template'; // adjust path if needed



interface Message {
  text: string;
  sender: 'user' | 'bot';
}

const questions = [
  {
    key: 'name',
    text: 'What is your full name?',
  },
  {
    key: 'address',
    text: 'What is your mailing address?',
  },
  {
    key: 'cityStateZip',
    text: 'City, State, and ZIP code?',
  },
  {
    key: 'email',
    text: 'What is your email address?',
  },
  {
    key: 'phone',
    text: 'What phone number should we include?',
  },
  {
    key: 'job',
    text: 'What job are you applying for, and where?',
  },
  {
    key: 'experience',
    text: 'Can you tell me about your work experience — or share your resume if you have one?',
  },
  {
    key: 'company',
    text: 'What company is this job at?',
  },
  {
    key: 'fit',
    text: 'Why does this job sound like a good fit for you?',
  },
  {
    key: 'tone',
    text: 'What kind of tone would you like the letter to have? (e.g., formal, warm, confident)',
  },
];





const ChatComponent: React.FunctionComponent = () => {
  const [input, setInput] = React.useState("");
  const [answers, setAnswers] = React.useState<{ [key: string]: string }>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0);
  const { messages, sendMessage, addMessage } = useChatbot();
  const ref = useChatScroll(messages);
  const initialLoadRef = React.useRef(true);

  React.useEffect(() => {
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
  
      const alreadyAsked = messages.some(
        (msg) => msg.text === questions[0].text && msg.sender === 'bot'
      );
  
      if (!alreadyAsked) {
        addMessage({
          text: questions[0].text,
          sender: 'bot',
        });
      }
    }
  }, []);
  const [pdfUrl, setPdfUrl] = React.useState<string | null>(null);
  const generatePdfFromText = async (fullText: string) => {
    const inputs = [{
      header: `${answers.name} - Cover Letter`,
      contact: `${answers.email} | ${answers.phone}`,
      body: fullText,
      signature: `Sincerely,\n${answers.name}`,
    }];    
  
    const pdf = await generate({ template: pdfTemplate, inputs });
  
    const blob = new Blob([pdf.buffer], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
  
    addMessage({
      text: "Looks like you're writing a cover letter! 📄 Here's your download link:",
      sender: 'bot',
    });

    addMessage({
      text: url,
      sender: 'bot',
    });
  };  

  const handleSend = () => {
    if (!input.trim()) return;

    const currentQuestion = questions[currentQuestionIndex];

    addMessage({ text: input, sender: 'user' });
    setAnswers((prev) => ({ ...prev, [currentQuestion.key]: input }));
    setInput("");

    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex < questions.length) {
      setTimeout(() => {
        addMessage({
          text: questions[nextIndex].text,
          sender: 'bot',
        });
        setCurrentQuestionIndex(nextIndex);
      }, 500);
    } else {

      const prompt = `
      Write a Microsoft Word-style cover letter using the information below.
      
      Start the letter with a formatted contact block that includes only the provided information — do not include placeholder text like [Your Name] or [Date]. Just write it out like a real letter.
      
      ${answers.name}
      ${answers.address}
      ${answers.cityStateZip}
      ${answers.email}
      ${answers.phone}
      ${new Date().toLocaleDateString()}
      
      Then write the greeting like: "Dear ${answers.company} Hiring Team,"
      
      Include the following points in the body:
      
      - Job: ${answers.job}
      - Experience: ${answers.experience}
      - Fit: ${answers.fit}
      
      Use a tone that is ${answers.tone}. Keep it professional and friendly.
      
      End the letter with a closing and the name: ${answers.name}
      `;
      sendMessage(prompt).then((botReply) => {
        if (botReply) {
          generatePdfFromText(botReply);
        }
      });
    }
  };

  return (
    <div className="flex flex-col h-[80vh] bg-white">
      {/* Header */}
      <h2 className="p-4 font-semibold text-lg text-center bg-blue-100 flex text-blue-800 justify-center items-center gap-2">
        Cover Letter Generator <LuBot size={25} />
      </h2>

      {/* Chat Messages */}
      <div ref={ref} className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((msg: Message, index: number) => (
          <div
            key={index}
            className={`p-3 rounded-lg max-w-xs ${
              msg.sender === 'user'
                ? 'bg-blue-500 text-white ml-auto'
                : 'bg-gray-300 text-gray-800'
            }`}
          >
            {msg.text.startsWith('blob:') ? (
              <a
                href={msg.text}
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-blue-700"
              >
                📄 Download your cover letter (PDF)
              </a>
            ) : (
            <Markdown>{msg.text}</Markdown>
            )}
          </div>
        ))}
      </div>

      {/* Input Box */}
      <div className="flex items-center p-4 bg-gray-50">
        <input
          type="text"
          className="flex-1 p-2 border rounded-lg focus:outline-none"
          placeholder="Your answer..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <button onClick={handleSend} className="ml-2 bg-blue-500 text-white p-2 rounded">
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatComponent;
