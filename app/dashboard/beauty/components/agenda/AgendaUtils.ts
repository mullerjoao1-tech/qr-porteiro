export function formatarDataCompleta(data: Date) {
  const texto = data.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function formatarDataCurta(data: Date) {
  return data.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

export function adicionarDias(data: Date, quantidade: number) {
  const novaData = new Date(data);
  novaData.setDate(novaData.getDate() + quantidade);
  return novaData;
}

export function dataEhHoje(data: Date) {
  const hoje = new Date();

  return (
    data.getDate() === hoje.getDate() &&
    data.getMonth() === hoje.getMonth() &&
    data.getFullYear() === hoje.getFullYear()
  );
}

export function formatarValor(valor: number) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function calcularFimHorario(
  horario: string,
  duracaoMinutos: number
) {
  const [horaTexto, minutoTexto] = horario.split(":");
  const hora = Number(horaTexto);
  const minuto = Number(minutoTexto);

  const data = new Date();
  data.setHours(hora, minuto + duracaoMinutos, 0, 0);

  return data.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatarTelefone(telefone: string) {
  const numeros = telefone.replace(/\D/g, "");

  if (numeros.length === 11) {
    return numeros.replace(
      /(\d{2})(\d{5})(\d{4})/,
      "($1) $2-$3"
    );
  }

  if (numeros.length === 10) {
    return numeros.replace(
      /(\d{2})(\d{4})(\d{4})/,
      "($1) $2-$3"
    );
  }

  return telefone;
}

export function tempoRestante(dataHora: Date) {
  const diferencaMs = dataHora.getTime() - Date.now();

  if (diferencaMs <= 0) {
    return "Agora";
  }

  const minutos = Math.floor(diferencaMs / 60000);

  if (minutos < 60) {
    return `${minutos} min`;
  }

  const horas = Math.floor(minutos / 60);
  const minutosRestantes = minutos % 60;

  if (minutosRestantes === 0) {
    return `${horas}h`;
  }

  return `${horas}h ${minutosRestantes}min`;
}

export function obterSaudacao() {
  const hora = new Date().getHours();

  if (hora < 12) {
    return "Bom dia";
  }

  if (hora < 18) {
    return "Boa tarde";
  }

  return "Boa noite";
}

export function calcularPercentualConfirmacao(
  totalConfirmados: number,
  totalAgendamentos: number
) {
  if (totalAgendamentos <= 0) {
    return 0;
  }

  return Math.round(
    (totalConfirmados / totalAgendamentos) * 100
  );
}
