import { useState } from "react";
import "./App.css";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";


function App() {

  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);



  const callAPI = async (endpoint) => {

    setLoading(true);
    setOutput("");

    try {

      const res = await fetch(
        `http://127.0.0.1:8000/${endpoint}`,
        {
          method:"POST",
          headers:{
            "Content-Type":"application/json",
          },

          body:JSON.stringify({
            code:input
          })
        }
      );


      const data = await res.json();


      if(data.result){

        setOutput(data.result);

      }
      else{

        setOutput(data.error || "Something went wrong");

      }


    }

    catch(error){

      setOutput("❌ Backend connection failed");

    }


    setLoading(false);

  };




  const copyOutput = ()=>{

    navigator.clipboard.writeText(output);

  };
  
  return (

<div className="app">


<header>

<h1> DevMate AI</h1>

<p>Your Personal AI Coding Assistant</p>

</header>

<div className="container">

{/* INPUT SECTION */}

<div className="card">

<h2> Code / Error Input</h2>

<textarea

placeholder="// Paste your code or error here..."

value={input}

onChange={(e)=>setInput(e.target.value)}

/>

<div className="counter">

Characters : {input.length}

</div>

<div className="buttons">


<button onClick={()=>callAPI("explain")}>
Explain
</button>
<button onClick={()=>callAPI("analyze")}>
Analyze
</button>



<button onClick={()=>callAPI("bugs")}>
 Find Bugs
</button>



<button onClick={()=>callAPI("optimize")}>
Optimize
</button>



<button onClick={()=>callAPI("tests")}>
Generate Tests
</button>



</div>


</div>

{/* OUTPUT SECTION */}


<div className="card">


<div className="output-title">


<h2> AI Response</h2>


{
output &&

<button 
className="copy"
onClick={copyOutput}
>
Copy
</button>

}


</div>

{

loading ?


<div className="loader">

<span></span>
AI is thinking...

</div>

:


<div className="ai-response">


{

output ?

<ReactMarkdown

remarkPlugins={[remarkGfm]}


components={{


code({

inline,

className,

children,

...props

}){


const match =
/language-(\w+)/.exec(className || "");



return !inline && match ?



<SyntaxHighlighter

style={oneDark}

language={match[1]}

{...props}

>

{String(children).replace(/\n$/,"")}

</SyntaxHighlighter>

:

<code className="inline-code">

{children}

</code>


}



}}


>

{output}


</ReactMarkdown>



:


<p className="placeholder">

Your AI result will appear here 

</p>


}


</div>



}


</div>



</div>



</div>


  );

}


export default App;