export enum Genero {
  Masculino = "M",
  Feminino = "F",
}

export enum Privilegio {
  Anciao = "Ancião",
  ServoMinisterial = "Servo Ministerial",
  Publicador = "Publicador",
}

export enum StatusEscala {
  Agendado = "Agendado",
  Confirmado = "Confirmado",
  Substituido = "Substituído",
  Cancelado = "Cancelado",
}

export enum TipoEvento {
  Normal = "Normal",
  Assembleia = "Assembleia",
  Congresso = "Congresso",
  VisitaSuperintendente = "Visita Superintendente",
  Celebracao = "Celebração",
  FeriadoLocal = "Feriado Local",
}

export interface IPublicador {
  id: string;
  nomeCompleto: string;
  genero: Genero;
  estadoCivil: "Solteiro" | "Casado" | "Viúvo" | "Divorciado";
  paiMae: boolean;
  menorIdade: boolean;
  batizado: boolean;
  grupoFamiliarId?: string;
  privilegio: Privilegio;
  designacaoEspecial?: string;
  aprovadoPresidente: boolean;
  aprovadoDirigenteEbc: boolean;
  fazOracao: boolean;
  leEstudoBiblico: boolean;
  estudanteAtivo: boolean;
}

export interface IParteReuniao {
  id: string;
  secao: "Tesouros" | "Ministerio" | "Vida Crista";
  nomeParte: string;
  generoExigido: Genero | "Qualquer";
  privilegioMinimo: Privilegio;
  privilegioAlvo?: Privilegio;
  exigeAjudante: boolean;
  restringeAjudanteFamiliaOuMesmoSexo: boolean;
}

export interface IEscala {
  id: string;
  dataReuniao: Date;
  parteId: string;
  titularId: string;
  ajudanteId?: string;
  status: StatusEscala;
}

export interface IEventoCalendario {
  id: string;
  dataEvento: Date;
  tipo: TipoEvento;
  descricao?: string;
  nomeResponsavel?: string;
  cancelaReuniaoMeioSemana: boolean;
}
