class AccountHandler extends HandlerBase {
	public constructor() {
		super();
	}
	public onReceive(subCode: number, value: any) {
		switch(subCode) {
			case AccountCode.LOGIN:
				console.log('login')
				this.loginResponse(<number>value);
				break;
			case AccountCode.REGIST_SRES:
				this.registResponse(<number>value);
				break;
		}
	}
	private loginResponse(result: number) {
		try {
            if(result != 0) return;
            Game.getInstance().noticeManager.addNotice("登录成功");
            // 请求USER数据
			console.log('请求用户信息')
            let socketMsg: SocketMsg = new SocketMsg(OpCode.USER, UserCode.GET_INFO_CREQ, null);
            this.dispatch(AreaCode.NET, NetEventCode.SEND, socketMsg);
            console.log('广播消息')
		} catch (e) {
			console.log('response error: ', e);
        }
	}
	private registResponse(result: number) {
		if(result != 0) return;
		Game.getInstance().noticeManager.addNotice("注册成功");
	}
}
