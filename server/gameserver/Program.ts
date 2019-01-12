import ServerPeer from './../base/ServerPeer';
import NetMsgCenter from './NetMsgCenter';
class Program {
    /**
     * 启动游戏服务器
     */
    constructor() {
        try {
            let server = new ServerPeer();
            // 指定所关联的应用
            server.setApplication(new NetMsgCenter());
            server.start(8002, 10);
        } catch (e) {
           console.error('启动失败：', e);
        }
    }
}
new Program();
