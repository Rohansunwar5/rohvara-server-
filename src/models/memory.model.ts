import mongoose from 'mongoose';

const memorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Types.ObjectId
  },
  leaderboard: {
    type: Boolean,
    default: false
  },
  collectUserDetails: {
    type: Boolean,
    default: false
  },
  leaderboardLimit: {
    type: Number,
    default: 0
  },
  background: {
    backgroundColor: {
      type: String
    },
    textColor: {
      type: String
    },
    primaryBColor: {
      type: String
    },
    secondaryBColor: {
      type: String
    },
    image: {
      type: String
    },
  },
  logo: {
    image: {
      type: String
    },
    websiteUrl: {
      type: String
    }
  },
  favicon: {
    type: String
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  fontFamily: {
    type: String,
    required: true
  },
  textSize: {
    type: Number,
    required: true
  },
  timerInSeconds: {
    type: Number,
    default: 30
  },
  instructions: {
    type: [String]
  },
  displayInstructions: {
    type: Boolean,
    required: true,
    default: false
  },
  colums: {
    type: Number,
    required: true,
  },
  rows: {
    type: Number,
    required: true,
  },
  cardsImage: {
    type: [String]
  },
  challenges: {
    type: String,
    required: true
  },
  movesLimit: {
    type: Number,
    required: true,
    default: 10
  },
  soundtrack: {
    enabled: {
      type: Boolean,
      required: true,
      default: false,
    },
    file: {
      type: String
    }
  },
  cards: {
    insideColor: {
      type: String,
      required: true
    },
    coverType: {
      type: String,
      required: true
    },
    coverColor: {
      type: String
    },
    coverImage: {
      type: String
    }
  }
}, { timestamps: true });

export interface IMemory {
  userId: string,
  leaderboard: boolean,
  collectUserDetails: boolean,
  leaderboardLimit: number,
  background: {
    backgroundColor: string,
    textColor: string,
    primaryBColor: string,
    secondaryBColor: string,
    image: string,
  },
  logo: {
    image: string,
    websiteUrl: string
  },
  favicon: string,
  title: string,
  description: string,
  fontFamily: string,
  textSize: number,
  timerInSeconds: number,
  instructions: string[],
  displayInstructions: boolean,
  colums: number,
  rows: number,
  cardsImage: string[],
  challenges: string[],
  movesLimit: number,
  soundtrack: {
    enabled: boolean,
    file?: string
  },
  cards: {
    insideColor: string,
    coverType: string,
    coverColor?: string,
    coverImage?: string
  }
}

export default mongoose.model<IMemory>('Memory', memorySchema);
