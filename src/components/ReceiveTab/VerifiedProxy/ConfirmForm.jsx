import React, { Component } from 'react';
import Countdown from "react-countdown-clock";
import web3Api from "../../../apis/web3-common-api";
import PhoneForm from './PhoneForm';
import TxProgress from './ReceiveTxProgress';
import eth2phoneApi from "../../../apis/eth2phone-api";

export default class ConfirmForm extends Component {
	constructor(props) {
		super(props);
		this.state = {
			phone: this.props.phone,
			code: this.props.code,
			phoneCode: this.props.phoneCode,
			smsCode: "",
			isFetching: false,
			step: 0,
			txId: "",
			txAmount: 0,
			countdown: true
		};
	}


	submit() {
		const component = this;
		console.log(this.state);
		this.setState({ isFetching: true, step: 1 });
		eth2phoneApi.verifyPhoneAndWithdraw(this.props.phoneCode,
			this.props.phone,
			this.props.code,
			this.state.smsCode,
			this.props.to)
			.then(function (result) {
				console.log({ result });
				// tx is pending (not mined yet)
				component.setState({ step: 2, txId: result.pendingTxHash, txAmount: result.amount });
				return web3Api.getTransactionReceiptMined(result.pendingTxHash);
			}).then((txReceipt) => {
				console.log("Tx mined!");
				component.setState({ isFetching: false, step: 3 });
			}).catch(function (err) {
				console.log({ err });
				component.setState({
					error: (err.message || err.errorMessage || "Server error!"),
					isFetching: false,
					step: 0
				});
			});
	}

	resend() {
		const component = this;
		eth2phoneApi.sendSmsToPhone(component.state.phoneCode, component.state.phone, component.state.code).then(function (result) {
			if (!result.success) {
				throw new Error((result.errorMessage || "Server error"));
			}
		}).catch(function (err) {
			console.log({ err });
		});
		component.setState({ countdown: true })
	}

	render() {
		const component = this;
		return (
			<form>
				{this.state.step > 0 ? <div className="modal-body" style={{ marginBottom: "50px" }}>
					<TxProgress step={this.state.step} txId={this.state.txId} address={this.props.to} txAmount={this.state.txAmount} /></div> :
					<div className="input-container">
						<div style={{ width: "80%", float: "left" }} >
							<input className="form-control" type="text" style={{ marginTop: "5px" }} onChange={(event) => this.setState({ smsCode: event.target.value })} placeholder="Enter SMS code you've received" />
						</div>
						<div style={{ width: "17%", float: "right" }}>
							{component.state.countdown === true ?
								<Countdown seconds={60}
									color="#f6a821"
									alpha={0.9}
									size={45}
									onComplete={() => { component.setState({ countdown: false }) }} /> : <a className="btn btn-md btn-accent" style={{ marginTop: "5px" }} onClick={() => component.resend()}>Resend</a>}</div>
					</div>
				}
				<br />
				<br />
				<div className="col-md-12" style={{ marginLeft: "-10px" }}>
					{this.state.step === 0 ? <a className="btn btn-md btn-accent" onClick={() => component.submit()}>Confirm</a> : ""}
					<span style={{ color: "red" }} > {component.state.error}</span>
				</div>
			</form>
		);
	}
}
