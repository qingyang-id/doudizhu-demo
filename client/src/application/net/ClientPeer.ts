class ClientPeer {
    private socket: egret.WebSocket;
    private ip: string;
    private port: number;
    private status: number = 0; // 0未创建，1建立中，2连接失败，10连接建立成功

    constructor(ip: string, port: number) {
        this.ip = ip;
        this.port = port;
        this.connect();
    }

    private connect() {
        try {
            if (this.status === 1) {
                 console.log('链接建立中...');
                 return;
            }
            this.status = 1;
            this.socket = new egret.WebSocket();
            this.socket.type = egret.WebSocket.TYPE_BINARY;
            // 添加收到数据的监听，收到数据后会调用此方法
            this.socket.addEventListener(egret.ProgressEvent.SOCKET_DATA, this.onReceiveMessage, this)
            // 添加连接打开的监听，连接成功会调用此方法
            this.socket.addEventListener(egret.Event.CONNECT, this.onSocketOpen, this)
            // 添加连接关闭是侦听，手动关闭或者服务器关闭连接会调用此方法
            this.socket.addEventListener(egret.Event.CLOSE, this.onSocketClose, this);
            // 添加异常侦听，出现异常会调用此方法
            this.socket.addEventListener(egret.IOErrorEvent.IO_ERROR, this.onSocketError, this);
            // 连接服务器
            this.socket.connect(this.ip, this.port);
        } catch (e) {
            console.error('create web socket connection failed:', e);
            this.status = 2;
        }
    }

    private application: IApplication;

    /**
     * 设置上层应用
     */
    public setApplication(app: IApplication) {
        this.application = app;
    }

    /**
     * 连接服务器成功回调
     */
    private onSocketOpen() {
        console.log('服务器连接成功！');
        this.status = 10;
    }

    /**
     * 接收并处理数据
     */
    private onReceiveMessage() {
        let byte: egret.ByteArray = new egret.ByteArray();
        this.socket.readBytes(byte);
        let msg = EncodeTool.decodePacket(byte);
        console.log('receive msg: ', msg);
        this.processReceive(msg);
    }

    private processReceive(msg: SocketMsg) {
        this.application.onReceive(msg);
    }

    /**
     * 发送消息
     */
    public send(opCode: number, subCode: number, value: any): void {
        let msg = new SocketMsg(opCode, subCode, value);
        console.log('send msg: ', msg);
        this.sendMsg(msg);
    }

    public sendMsg(msg: SocketMsg): void {
        let packet = EncodeTool.encodePacket(msg);
        try {
            this.socket.writeBytes(packet, 0, packet.bytesAvailable);
            this.socket.flush();
        } catch (e) {
            console.error(e);
        }
    }


    private onSocketClose(...args) {
        console.log('socket closed:', args);
        this.status = 2;
        setTimeout(() => this.connect(), 1000);
    }

    private onSocketError(...args) {
        console.log('socket error:', args, this.status, Date.now());
        if (this.status !== 1) {
            this.status = 2;
            setTimeout(() => this.connect(), 1000);
        }
    }

}
