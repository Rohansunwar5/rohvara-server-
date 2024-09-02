import mongoose from 'mongoose';

const segmentSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  prize: {
    type: String,
    required: true
  },
  weight: {
    type: Number,
    required: true
  },
  color: {
    type: String,
    required: true
  },
  textColor: {
    type: String,
    required: true,
  },
  isWin: {
    type: Boolean,
    required: true,
    default: false
  }
});

const spinTheWheelSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Types.ObjectId
  },
  segments: [segmentSchema],
  background: {
    hexCode: {
      type: String
    },
    textSize: {
      type: String
    },
    fontFamily: {
      type: String
    },
    image: {
      type: String
    }
  },
  winnersOnly: {
    type: Boolean,
    required: true,
    default: false
  },
  instructions: {
    type: [String]
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  displayInstructions: {
    type: Boolean,
    required: true,
    default: false
  },
  textColor: {
    type: String,
    required: true
  },
  secondaryColor: {
    type: String,
    required: true
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
  }
}, { timestamps: true });

export interface ISpinTheWheel {
  userId: string;
  segments: {
    id: string;
    prize: string;
    weight: number,
    color: string;
    textColor: string;
    isWin: boolean;
  }[],
  background: {
    hexCode: string;
    textSize: string;
    fontFamily: string;
    image: string;
  },
  winnersOnly: boolean;
  instructions: string[];
  title: string;
  description: string;
  displayInstructions: boolean;
  textColor: string;
  secondaryColor: string;
  logo: {
    image: string;
    websiteUrl: string;
  },
  favicon: string;
}

export default mongoose.model<ISpinTheWheel>('spinTheWheel', spinTheWheelSchema);
