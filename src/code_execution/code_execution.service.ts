import { Injectable } from '@nestjs/common';
import Dockerode from 'dockerode';
import { PYTHON_IMAGE, JAVA_IMAGE, CPP_IMAGE } from './images';
import { v4 as uuidv4 } from 'uuid';

const docker = new Dockerode(); // ✅ Create an instance of Docker

@Injectable()
export class CodeExecutionService {
    async createContainer(image: string, cmd: string[], containerId: string) {
        try {
            const container = await docker.createContainer({
                Image: image,
                Cmd: cmd,
                AttachStdin: true,
                AttachStdout: true,
                AttachStderr: true,
                OpenStdin: true,
                Tty: false,
                name: containerId,
                HostConfig: {
                    AutoRemove: true,
                    Memory: 200 * 1024 * 1024,
                    NetworkMode: 'none',
                    Ulimits: [
                        { Name: "cpu", Soft: 2, Hard: 3 },
                        { Name: "nproc", Soft: 5, Hard: 5 }
                    ],
                }
            });

            console.log("Container created successfully:", containerId);
            return container;
        } catch (error) {
            console.error("Error creating container:", error);
            throw error;
        }
    }

    async pullImage(image: string) {
        try {
            console.log("Pulling image:", image);
            const stream = await docker.pull(image);
            await new Promise((resolve, reject) => {
                docker.modem.followProgress(stream, (err, res) => {
                    if (err) reject(new Error(`Error pulling image: ${err.message}`));
                    else resolve(`Image pulled successfully: ${image}`);
                });
            });
        } catch (error) {
            console.error(`Error pulling image ${image}:`, error.message);
            throw error;
        }
    }

    async streamLogs(container) {
        try {
            const logsStream = await container.logs({
                stdout: true,
                stderr: true,
                follow: true,
                since: 0,
            });

            return new Promise((resolve, reject) => {
                const completeBuffer = [];
                let stderr = "";
                let stdout = "";

                const timeoutId = setTimeout(async () => {
                    try {
                        await container.kill();
                        stderr += '\nError: Time Limit Exceeded';
                        resolve({ stdout, stderr });
                    } catch (error) {
                        console.error('Error killing container:', error);
                        reject(new Error('Time Limit Exceeded'));
                    }
                }, 1500);

                logsStream.on('data', (chunk) => completeBuffer.push(chunk));

                logsStream.on('end', () => {
                    clearTimeout(timeoutId);
                    console.log('Log streaming finished.');
                    resolve(Buffer.concat(completeBuffer));
                });

                logsStream.on('error', (err) => {
                    clearTimeout(timeoutId);
                    console.error('Error in log streaming:', err);
                    reject(new Error('Error in Streaming Logs'));
                });
            });
        } catch (err) {
            console.error('Error in fetching logs:', err);
            throw err;
        }
    }

    getImage(language: string) {
        switch (language.toLowerCase()) {
            case 'python': return PYTHON_IMAGE;
            case 'java': return JAVA_IMAGE;
            case 'cpp': return CPP_IMAGE;
            default: throw new Error('Unsupported language');
        }
    }

    getCommand(code: string, language: string, input: string) {
        switch (language.toLowerCase()) {
            case 'python':
                return [`/bin/sh`, `-c`, `cd /home && echo '${code.replace(/'/g, `'\\"`)}' > main.py && echo '${input.replace(/'/g, `'\\"`)}' | python3 main.py`];
            case 'java':
                return [`/bin/sh`, `-c`, `cd /home && echo '${code.replace(/'/g, `'\\"`)}' > Main.java && javac Main.java && echo '${input.replace(/'/g, `'\\"`)}' | java Main`];
            case 'cpp':
                return [`/bin/sh`, `-c`, `cd /home && echo '${code.replace(/'/g, `'\\"`)}' > main.cpp && g++ main.cpp -o main && echo '${input.replace(/'/g, `'\\"`)}' | ./main`];
            default:
                throw new Error('Unsupported language');
        }
    }

    async processDockerLogs(buffer: Buffer) {
        let stdout = '';
        let stderr = '';
        let i = 0;

        while (i < buffer.length) {
            const streamType = buffer[i];
            const messageLength = buffer.readUInt32BE(i + 4);
            i = i + 8;

            if (streamType === 1) {
                stdout += buffer.toString('utf-8', i, i + messageLength);
            } else if (streamType === 2) {
                stderr += buffer.toString('utf-8', i, i + messageLength);
            }

            i += messageLength;
        }

        return {
            stdout: stdout.trim(),
            stderr: stderr.trim()
        };
    }

    async executeCode(code: string, language: string, input: string = "HELLO WORLD") {
        try {
            const image = this.getImage(language);
            const command = this.getCommand(code, language, input);
            const containerId = uuidv4();

            console.log(`Creating container: ${containerId}`);
            const container = await this.createContainer(image, command, containerId);
            
            console.log(`Starting container: ${containerId}`);
            await container.start();

            console.log(`Fetching logs for container: ${containerId}`);
            const logs = await this.streamLogs(container);

            const processedLogs = await this.processDockerLogs(logs as Buffer);

            return processedLogs;
        } catch (error) {
            console.error('Error executing code:', error);
            throw error;
        }
    }
}
