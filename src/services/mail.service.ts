import { BadRequestError } from '../errors/bad-request.error';
import { ses } from '../utils/ses.util';
import ejs from 'ejs';
import fs from 'fs';

class MailService {
  constructor(private readonly _ses = ses) { }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async sendEmail(toEmail: string, templatePath: string, templateData: any, subject: string) {
    const params = {
      Destination: {
        ToAddresses: [toEmail]
      },
      Message: {
        Body: {
          Html: {
            Charset: 'UTF-8',
            Data: ejs.render(fs.readFileSync(`src/templates/${templatePath}`, 'utf8'), templateData)
          }
        },
        Subject: {
          Charset: 'UTF-8',
          Data: subject
        }
      },
      Source: 'WorkPlay Studio Pvt Ltd. <no-reply@workplay.digital>',
    };

    const response = await this._ses.sendEmail(params).promise();
    if (!response) throw new BadRequestError('Failed to upload file');

    return {};
  }

}

export default new MailService();