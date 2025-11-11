//ipn/Ingenieria.js
import React, { useEffect, useState } from 'react';

const Ingenieria = () => {
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    const fetchQuestions = async () => {
      const url = `${process.env.PUBLIC_URL}/cuestionarios/ipn/cuestionario3.csv`;
      const res = await fetch(url);
      const csv = await res.text();
      const Papa = (await import('papaparse')).default;
      const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true });
      setQuestions(parsed.data);
    };
    fetchQuestions();
  }, []);

  return (
    <div>
      <h1>Cuestionario: Ingeniería Ciencias Físico Matemáticas (IPN)</h1>
      <ul>
        {questions.map((q, i) => (
          <li key={i}>{q.Pregunta}</li>
        ))}
      </ul>
    </div>
  );
};

export default Ingenieria;

