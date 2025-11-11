import React, { useEffect, useState } from 'react';
import Papa from 'papaparse';
import cuestionarioCsv from './cuestionario6.csv'; // Ruta al archivo CSV

const Ingenieria = () => {
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    const fetchQuestions = async () => {
      const response = await fetch(cuestionarioCsv);
      const reader = response.body.getReader();
      const result = await reader.read();
      const decoder = new TextDecoder('utf-8');
      const csv = decoder.decode(result.value);
      const parsedData = Papa.parse(csv, { header: true });
      setQuestions(parsedData.data);
    };

    fetchQuestions();
  }, []);

  return (
    <div>
      <h1>Cuestionario: Ingeniería Ciencias Físico Matemáticas (IPN)</h1>
      <ul>
        {questions.map((question, index) => (
          <li key={index}>{question.Pregunta}</li>
        ))}
      </ul>
    </div>
  );
};

export default Ingenieria;
