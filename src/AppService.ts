// Esempio di come dovrà diventare la funzione nel tuo codice React
async function getExpertAnswer(userQuestion: string, history: any[]) {
  try {
    // Sostituisci con l'URL che ti darà Render
    const response = await fetch("https://beyblade-brain.onrender.com/chat", { 
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: userQuestion,
        messages: history // Assicurati che il formato sia compatibile
      })
    });
    
    const data = await response.json();
    return data.answer;
  } catch (error) {
    console.error("Errore Backend:", error);
    return "Il server Beyblade Brain non risponde al momento.";
  }
}