import React, { useEffect, useState } from 'react';
import Papa from 'papaparse';
import cuestionarioCsv from './cuestionario5.csv'; // Ruta al archivo CSV

const SocialesAdministrativas = () => {
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
      <h1>Cuestionario: Ciencias Sociales y Administrativas (IPN)</h1>
      <ul>
        {questions.map((question, index) => (
          <li key={index}>{question.Pregunta}</li>
        ))}
      </ul>
    </div>
  );
};

export default SocialesAdministrativas;
