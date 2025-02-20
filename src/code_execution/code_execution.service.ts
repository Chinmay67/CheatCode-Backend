import { Injectable } from '@nestjs/common';
import * as Dockerode from 'dockerode';
import { PYTHON_IMAGE, JAVA_IMAGE, CPP_IMAGE } from './images';
import { v4 as uuidv4 } from 'uuid';
// import fs from 'fs';
// import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';


const docker = new Dockerode();

@Injectable()
export class CodeExecutionService {
//   private writeFileAsync: (path: string, data: string) => Promise<void>;
//   private unlinkAsync: (path: string) => Promise<void>;

//   constructor() {
//     this.writeFileAsync = promisify(fs.writeFile);
//     this.unlinkAsync = promisify(fs.unlink);
//   }

  async create_container(image: string, cmd: string[], containerId: string) {
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
            { Name: 'cpu', Soft: 2, Hard: 3 },
            { Name: 'nproc', Soft: 5, Hard: 5 },
          ],
        },
      });

      console.log('Container created successfully:', containerId);
      return container;
    } catch (error) {
      console.error('Error creating container:', error);
      throw error;
    }
  }

  async pullImage(image: string) {
    try {
      console.log('Pulling image:', image);
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
      });

      let stdout = '';

      for await (const chunk of logsStream) {
        const output = chunk.toString();
        stdout += output;
        console.log(`Chunk received: ${output}`);
      }

      console.log('Log streaming finished.');
      return { stdout };
    } catch (err) {
      console.error('Error in fetching logs:', err);
      throw err;
    }
  }

  getImage(language: string) {
    switch (language) {
      case 'python':
        return PYTHON_IMAGE;
      case 'java':
        return JAVA_IMAGE;
      case 'cpp':
        return CPP_IMAGE;
      default:
        throw new Error('Unsupported language');
    }
  }

  // getCommand(code: string, language: string, input: string) {
  //     switch (language) {
  //         case 'python':
  //             return [`/bin/sh`, `-c`, `printf '${code}' > /home/main.py && python3 /home/main.py`];
  //         case 'java':
  //             return [
  //                 '/bin/sh', '-c',
  //                 `echo '${code.replace(/'/g, `'\\"`)}' > /home/Main.java && javac /home/Main.java && java -cp /home Main`
  //             ];

  //         case 'cpp':
  //             return [`/bin/sh`, `-c`, `cd /home && echo '${code.replace(/'/g, `'\\"`)}' > main.cpp && g++ main.cpp -o main && echo '${input.replace(/'/g, `'\\"`)}' | ./main`];
  //         default:
  //             throw new Error('Unsupported language');
  //     }
  // }
  private getCommand(
    filePath: string,
    language: string,
    input: string,
  ): string[] {
    const commands: { [key: string]: string[] } = {
      python: ['python3', filePath],
      javascript: ['node', filePath],
      typescript: ['ts-node', filePath],
      java: [
        'sh',
        '-c',
        `javac ${filePath} && java ${filePath.replace('.java', '')}`,
      ],
      cpp: ['sh', '-c', `g++ ${filePath} -o /tmp/a.out && /tmp/a.out`],
      c: ['sh', '-c', `gcc ${filePath} -o /tmp/a.out && /tmp/a.out`],
    };

    if (!(language in commands)) {
      throw new Error(`Unsupported language: ${language}`);
    }

    // If input is required, modify the command to echo input and pipe it into execution
    if (input) {
      return ['sh', '-c', `echo "${input}" | ${commands[language].join(' ')}`];
    }

    return commands[language];
  }

  async processDockerLogs(logs: { stdout: string }) {
    return {
      stdout: logs.stdout.trim(),
    };
  }

  // async executeCode(code: string, language: string, input: string = "HELLO WORLD") {
  //     try {
  //         const image = this.getImage(language);
  //         const command = this.getCommand(code, language, input);
  //         const containerId = uuidv4();

  //         console.log(`Creating container: ${containerId}`);
  //         const container = await this.create_container(image, command, containerId);

  //         console.log(`Starting container: ${containerId}`);
  //         await container.start();

  //         console.log(`Fetching logs for container: ${containerId}`);
  //         const logs = await this.streamLogs(container);

  //         const processedLogs = await this.processDockerLogs(logs);

  //         return processedLogs;
  //     } catch (error) {
  //         console.error('Error executing code:', error);
  //         throw error;
  //     }
  // }

 
    async executeCode(
      code: string,
      language: string,
      input: string = 'HELLO WORLD',
    ) {
      try {
        const containerId = uuidv4();
  
        // Define the absolute path to `src/public`
        const projectRoot = path.resolve(__dirname, '..', '..'); // Move up from `dist`
        const publicDir = path.join(projectRoot, 'src', 'public');
  
        // Ensure `public` directory exists
        if (!fs.existsSync(publicDir)) {
          fs.mkdirSync(publicDir, { recursive: true });
        }
  
        const tempFileName = `temp-${containerId}${this.getFileExtension(language)}`;
        const tempFilePath = path.join(publicDir, tempFileName); // Store the file in `src/public`
        const containerFilePath = `/app/${tempFileName}`; // Correct container path
  
        // Write the code to a temporary file inside `public`
        await fs.promises.writeFile(tempFilePath, code, 'utf-8');
  
        console.log(`Created temporary file: ${tempFilePath}`);
  
        const image = this.getImage(language);
        const command = this.getCommand(containerFilePath, language, input);
  
        console.log(`Creating container: ${containerId}`);
        const container = await docker.createContainer({
          Image: image,
          Cmd: command,
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
            Binds: [`${publicDir.replace(/\\/g, '/')}:/app`], // ✅ Correctly bind host `public` dir to `/app`
            Ulimits: [
              { Name: 'cpu', Soft: 2, Hard: 3 },
              { Name: 'nproc', Soft: 5, Hard: 5 },
            ],
          },
          WorkingDir: '/app', // ✅ Set correct working directory
        });
  
        console.log(`Starting container: ${containerId}`);
        await container.start();
  
        console.log(`Fetching logs for container: ${containerId}`);
        const logs = await this.streamLogs(container);
  
        const processedLogs = await this.processDockerLogs(logs);
  
        // Cleanup: Remove temp file after execution
        // await fs.promises.unlink(tempFilePath);
        console.log(`Deleted temporary file: ${tempFilePath}`);
  
        return processedLogs;
      } catch (error) {
        console.error('Error executing code:', error);
        throw error;
      }
    }

  /**
   * Get the file extension based on the programming language.
   */
  private getFileExtension(language: string): string {
    const extensions: { [key: string]: string } = {
      python: '.py',
      java: '.java',
      cpp: '.cpp',
    };
    return extensions[language] || '.txt';
  }
}
