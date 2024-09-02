import quizUserSessionsModel from '../models/quiz-user-sessions.model';

export class QuizUserSessionRepository {
  private _model = quizUserSessionsModel;

  async create(params: { quizId: string, fullName: string, email: string, duration: number, score: number }) {
    const { quizId, fullName, email, duration, score } = params;
    return this._model.create({ quizId, fullName, email, duration, score });
  }

  async getLeaderboard(quizId: string) {
    return this._model.find({ quizId });
  }

  async checkUserSessionExists(quizId: string, email: string) {
    return this._model.findOne({ quizId, email });
  }

  async getQuizSessions(quizId: string) {
    return this._model.find({ quizId });
  }
}