import React from 'react';

export function CodeView({ lines = [], language = 'tac' }) {
  const isComment = (l) => l.trim().startsWith(';') || l.trim().startsWith('#');
  const isLabel = (l) => /^L\d+:$/.test(l.trim());
  const isDirective = (l) => l.trim().startsWith('.');

  return (
    <div className="code-view">
      <div className="code-toolbar">
        <span className="code-lang">{language.toUpperCase()}</span>
        <span className="code-lines">{lines.length} lines</span>
      </div>
      <div className="code-scroll">
        <table className="code-table">
          <tbody>
            {lines.map((line, i) => {
              let cls = 'code-line';
              if (isComment(line)) cls += ' line-comment';
              else if (isLabel(line)) cls += ' line-label';
              else if (isDirective(line)) cls += ' line-directive';
              else if (line.includes('=')) cls += ' line-assign';
              else if (line.startsWith('    j') || line.startsWith('goto')) cls += ' line-jump';

              return (
                <tr key={i} className={cls}>
                  <td className="line-num">{i + 1}</td>
                  <td className="line-content">
                    <HighlightedLine line={line} language={language} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function HighlightedLine({ line, language }) {
  if (!line) return <code></code>;

  if (language === 'asm') {
    const parts = line.split(/(;.*$|%\w+|\$[\d\w-]+|\b(movl|movq|addl|subl|imull|idivl|cmpl|jmp|je|jne|jl|jg|call|ret|leave|pushq|popq|cdq|xorl|orl|andl|sete|setne|setl|setg|setle|setge|movzbl|subq|leaq)\b)/g);
    return (
      <code>
        {parts.map((p, i) => {
          if (p?.startsWith(';')) return <span key={i} style={{color:'#666'}}>{p}</span>;
          if (p?.startsWith('%')) return <span key={i} style={{color:'#5bc8f5'}}>{p}</span>;
          if (p?.startsWith('$')) return <span key={i} style={{color:'#a8ff78'}}>{p}</span>;
          if (p && /^(movl|movq|addl|subl|imull|idivl|cmpl|jmp|je|jne|jl|jg|call|ret|leave|pushq|popq|cdq|xorl|orl|andl|sete|setne|setl|setg|setle|setge|movzbl|subq|leaq)$/.test(p))
            return <span key={i} style={{color:'#FA8112'}}>{p}</span>;
          return <span key={i}>{p}</span>;
        })}
      </code>
    );
  }

  const parts = line.split(/(#.*$|if_false|goto|return|print|\bt\d+\b|L\d+:?|[+\-*\/%=!<>&|]{1,2})/g);
  return (
    <code>
      {parts.map((p, i) => {
        if (p?.startsWith('#')) return <span key={i} style={{color:'#555'}}>{p}</span>;
        if (p && ['if_false','goto','return','print'].includes(p)) return <span key={i} style={{color:'#FA8112'}}>{p}</span>;
        if (p && /^t\d+$/.test(p)) return <span key={i} style={{color:'#c9b1ff'}}>{p}</span>;
        if (p && /^L\d+:?$/.test(p)) return <span key={i} style={{color:'#5bc8f5',fontWeight:'bold'}}>{p}</span>;
        if (p && /^[+\-*\/%=!<>&|]{1,2}$/.test(p)) return <span key={i} style={{color:'#FA8112'}}>{p}</span>;
        return <span key={i}>{p}</span>;
      })}
    </code>
  );
}

export default CodeView;