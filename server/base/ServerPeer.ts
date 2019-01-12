import ws = require('ws');
import ClientPeer from './ClientPeer';
import ClientPeerPool from './ClientPeerPool';
import IApplication from './IApplication';
import SocketMsg from './SocketMsg';

export default class ServerPeer {
    /**
     * 应用层
     */
    public application: IApplication;
    /**
     * 服务器端的server对象
     */
    private serverSocket: ws.Server;
    /**
     * 客户端对象的连接池
     */
    private clientPeerPool: ClientPeerPool;

    constructor() {}
    /**
     * 设置应用层
     * @param app
     */
    public setApplication(app: IApplication) {
        this.application = app;
    }
    /**
     * 开启服务器
     * @param port 端口号
     * @param peerCount 默认连接数量
     */
    public start(port: number, peerCount: number) {
        try {
            this.serverSocket = new ws.Server({
                port: port,
            });
            this.clientPeerPool = new ClientPeerPool();
            let tmpClientPeer: ClientPeer = null;
            for (let i = 0; i < peerCount; i++) {
                tmpClientPeer = new ClientPeer();
                tmpClientPeer.receiveCompleted = this.receiveCompleted.bind(this);
                this.clientPeerPool.enqueue(tmpClientPeer);
            }
            console.log('===== 服务器启动 =====');
            // 等待客户端的连接
            this.serverSocket.on('connection', (clientSocket) => {
                console.log('客户端连接成功');
                this.processAccept(clientSocket);
            });
            // 客户端关闭事件
            this.serverSocket.on('close', (error) => {
                console.log('客户端连接close:', error);
            });
            // 连接错误事件
            this.serverSocket.on('error', (error) => {
                console.log('客户端连接错误:', error);
            });
        } catch (e) {
            console.log(e);
        }
    }
    private processAccept(clientSocket: ws) {
        let client: ClientPeer = this.clientPeerPool.dequeue();
        client.socket = clientSocket;
        this.startReceive(client);
        this.monitorDisconnect(client);
    }
    private startReceive(client: ClientPeer) {
        try {
            client.socket.on('message', (data: Buffer) => {
                try {
                    this.processReceive(client, data);
                } catch (e) {
                    console.log(e);
                }
            });
        } catch (e) {
            console.log(e);
        }
    }
    private processReceive(client: ClientPeer, data: Buffer) {
        client.startReceive(data);
    }
    /**
     * 一条数据解析完成的处理
     */
    private receiveCompleted(client: ClientPeer, msg: SocketMsg): void {
        // 给应用层，让其使用
        this.application.onReceive(client, msg);
    }
    private monitorDisconnect(client: ClientPeer) {
        client.socket.on('disconnect', () => {
            try {
                this.disconnect(client);
            } catch (e) {
                console.log(e);
            }
        });
        client.socket.on('error', (err) => {
            console.error('clint error:', err);
        });
    }
    private disconnect(client: ClientPeer) {
        try {
            if (client == null) {
                console.log('当前指定的客户端连接对象为空，无法断开连接');
            }
            console.log('客户端断开连接');
            // 通知应用层，这个客户端断开连接
            this.application.onDisconnect(client);
            client.disconnect();
        } catch (e) {
            console.log(e);
        }
    }
}
