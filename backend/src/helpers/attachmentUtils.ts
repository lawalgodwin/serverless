// import { getDocumentClient } from '@shelf/aws-ddb-with-xray';
import * as AWS from 'aws-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import * as AWSXRay from 'aws-xray-sdk'
import { createDynamoDBClient } from './todosAcess';

const XAWS = AWSXRay.captureAWS(AWS)

const s3 = new XAWS.S3({
    signatureVersion: 'v4'
})

// TODO: Implement the fileStogare logic

export class AttachmentUtils {
    constructor(
        private readonly bucketName = process.env.ATTACHMENT_S3_BUCKET,
        private readonly urlExpiration = process.env.SIGNED_URL_EXPIRATION,
        private readonly todosTable = process.env.TODOS_TABLE,
        private readonly docClient: DocumentClient = createDynamoDBClient(),
        // private readonly docClient: DocumentClient = getDocumentClient({
        //     ddbParams: { region: 'us-east-1', convertEmptyValues: true },
        //     ddbClientParams: { region: 'us-east-1' },
        // })
    ) { }

    async generateUploadUrl(imageId: string, todoId: string, userId: string): Promise<string> {
        const params = {
            TableName: this.todosTable,
            Key: { todoId, userId },
            UpdateExpression: 'set attachmentUrl = :attachmentUrl',
            ExpressionAttributeValues: {
                ':attachmentUrl': `https://${this.bucketName}.s3.amazonaws.com/${imageId}`
            }
        };

        await this.docClient.update(params).promise();
        return s3.getSignedUrl('putObject', {
            Bucket: this.bucketName,
            Key: imageId,
            Expires: parseInt(this.urlExpiration)
        })
    }

}



