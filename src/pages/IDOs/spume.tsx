import React from 'react';
import Web3 from 'web3';
import { Row, Col, Button, ButtonGroup, Card, Modal, Alert} from 'react-bootstrap';

import { useState, useEffect } from 'react';
import '../index.scss';
import './index.scss';
import USDT from '../../assets/img/USDT.png';
import transactionLoader from '../../assets/img/loader.gif';
import { useDispatch, useSelector } from "react-redux";
import * as selectors from "store/selectors";
import { updateWalletConnection } from "store/actions";
import { tokenAddresses } from 'config';
import { AbiItem } from 'web3-utils';
import tokenABI from '../../abi/token.abi.json';
import idosABI from '../../abi/idos.abi.json';
import stakingABI from '../../abi/staking.abi.json';
import {StakingAddress, IdosAddress, poolAddress1} from 'config';
import confirmImage from '../../assets/img/Shape.png';


declare let window: any;

const Spume_IDOs = () => {
    const [isButtonClicked, setIsButtonClicked] = useState<boolean>(false);
    const [isModalShow, setModalShow] = useState<boolean>(false);
    const [isTransactionConfirm, setIsTransactionConfirm] = useState<boolean>(false);
    const [isStakeAmount, setIsStakeAmount] = useState<number>(0);
    const [isStakeAmountDollar, setIsStakeAmountDollar] = useState<number>(0);
    const [isDisableDepositButton, setIsDisableDepositButton] = useState<boolean>(false);
    const [isApporveButton, setIsApproveButton] = useState<boolean>(false);
    const [depositedAmount, setDepositedAmount] = useState<any>('0');
    const [raisedAmount, setRaisedAmount] = useState<any>('0');
    const [usdtbalance, setUsdtBalance] = useState<any>('0');

    const dispatch = useDispatch();
    const WalletState = useSelector(selectors.WalleteState);
    const connectionState = WalletState.wallet_connection;
    const wallet_balance = WalletState.wallet_balance;
    const web3 = new Web3(window.ethereum);

    const contract = new web3.eth.Contract(idosABI as AbiItem[], IdosAddress);
    const stakingcontract = new web3.eth.Contract(stakingABI as AbiItem[], StakingAddress);
    const onClick = (flag) => {
        if(flag == 'Deposit')
            setIsButtonClicked(false);
        else
            setIsButtonClicked(true);
    };
    const onStaking = () => {
        deposit(isStakeAmount);
    };
    const onWithdraw = () => {
        withdraw(isStakeAmount);
    };
    
    const closeModal = () => {
        setModalShow(false);
    };

    const onConnetWallet = async () => {
        if(connectionState) {
            return;
        }else {
            loadWeb3();
        }
    };
    const onApprove = async () => {
        const USDTAddress = tokenAddresses[1].address;
        const tokenInst = new web3.eth.Contract(tokenABI as AbiItem[], USDTAddress);
        const amount = await web3.utils.toWei("9999999999999", "ether");
        console.log("USDTAddress = ", USDTAddress);
        const approve = await tokenInst.methods.approve(poolAddress1, amount).send({
            from : WalletState.account_address
        });
        setIsApproveButton(false);
    };
    useEffect(() => {
        (async()=>{
            const poolinfo = await contract.methods.getCompletePoolDetails().call();
            //const raisedAmount_t = web3.utils.fromWei(poolinfo[3], "ether");
            const raisedAmount_t = web3.utils.fromWei(poolinfo[3], "mwei");
            setRaisedAmount(raisedAmount_t);
        
        })();
       
        if (window.ethereum) {
            window.ethereum.on("accountsChanged", handleAccountChanged);
            checkConnection();
            if(isStakeAmount == 0) {
                setIsDisableDepositButton(true);
            }
        }
    }, []);

    function checkConnection() {
        window.ethereum
          .request({ method: "eth_accounts" })
          .then(handleAccountChanged)
          .catch(console.error);
    }

    async function handleAccountChanged(accounts) {
        if (accounts.length === 0) {
          console.log("metamask locked");
          dispatch(
            updateWalletConnection({
              connection_state: false,
              account_address: "",
              wallet_balance : 0,
            })
          );
        } else {
            const USDTAddress = tokenAddresses[1].address;
            const tokenInst = new web3.eth.Contract(tokenABI as AbiItem[], USDTAddress);
            const balanceDec = await tokenInst.methods.balanceOf(accounts[0]).call();
           // const balance = await web3.utils.fromWei(balanceDec, "ether");

            const balance = await web3.utils.fromWei(balanceDec, "mwei");
            setUsdtBalance(balance);
            const userInfo = await stakingcontract.methods.users(accounts[0]).call();
            const depositedAmount_t = web3.utils.fromWei(userInfo[0], "ether");
            setDepositedAmount( depositedAmount_t );

            const poolinfo = await contract.methods.getCompletePoolDetails().call();
            //const raisedAmount_t = web3.utils.fromWei(poolinfo[3], "ether");
            const raisedAmount_t = web3.utils.fromWei(poolinfo[3], "mwei");
            setRaisedAmount(raisedAmount_t);
            const allowance = await tokenInst.methods.allowance(accounts[0], poolAddress1).call();
            if(allowance == 0) {
                console.log("allowance = ", allowance);
                setIsApproveButton(true);
            }
        }
    }

    const loadWeb3 = async () => {
        try {
          if (window.ethereum?.isMetaMask) {
            const accounts = await window.ethereum.request({
              method: "eth_requestAccounts",
            });
            const account = Web3.utils.toChecksumAddress(accounts[0]).toString();
            const USDTAddress = tokenAddresses[1].address;
            const tokenInst = new web3.eth.Contract(tokenABI as AbiItem[], USDTAddress);
            const balanceDec = await tokenInst.methods.balanceOf(accounts[0]).call();
            //const balance = await web3.utils.fromWei(balanceDec, "ether");
            const balance = await web3.utils.fromWei(balanceDec, "mwei");
            setUsdtBalance(balance);
            const userInfo = await stakingcontract.methods.users(accounts[0]).call();
            const depositedAmount_t = web3.utils.fromWei(userInfo[0], "ether");
            setDepositedAmount( depositedAmount_t );

            const poolinfo = await contract.methods.getCompletePoolDetails().call();
            //const raisedAmount_t = web3.utils.fromWei(poolinfo[3], "ether");
            const raisedAmount_t = web3.utils.fromWei(poolinfo[3], "mwei");
            setRaisedAmount(raisedAmount_t);
            //const depositedAmount_t = web3.utils.fromWei(userInfo[0], "ether");
            //setRaisedAmount( depositedAmount_t );
            const allowance = await tokenInst.methods.allowance(accounts[0], poolAddress1).call();
            if(allowance == 0) {
                console.log("allowance = ", allowance);
                setIsApproveButton(true);
            }
          } else {
            console.log("should install metamask");
          }
        } catch (error) {
          dispatch(
            updateWalletConnection({
              connection_state: false,
              account_address: "",
              wallet_balance : 0,
            })
          );
        }
    };
    const onMaxBalance = () => {
        if (!isButtonClicked){
            setIsStakeAmount(usdtbalance);
            setIsStakeAmountDollar (usdtbalance);
        } else{
            setIsStakeAmount(depositedAmount);
            setIsStakeAmountDollar (depositedAmount);
        }
        
        setIsDisableDepositButton(false);
    };
    const onhandleStakeAmount = (e) => {
        setIsStakeAmount(e.target.value);
        setIsStakeAmountDollar(e.target.value);
        if (depositedAmount >= 500)
            setIsDisableDepositButton(false);
        if(e.target.value == 0) setIsDisableDepositButton(true);
    };
    const deposit = async(amount) => {
        try {
            setModalShow(true);
            setIsTransactionConfirm(false);
            //const deposit_amount = await web3.utils.toWei(amount, 'ether');
            const deposit_amount = await web3.utils.toWei(amount, 'mwei');
            console.log("deposit_amount = ",deposit_amount);
            const deposit = await contract.methods.participate(deposit_amount).send({
                from : WalletState.account_address
            });

            const USDTAddress = tokenAddresses[1].address;
            const tokenInst = new web3.eth.Contract(tokenABI as AbiItem[], USDTAddress);
            const balanceDec = await tokenInst.methods.balanceOf(WalletState.account_address).call();
            //const balance = await web3.utils.fromWei(balanceDec, "ether");
            const balance = await web3.utils.fromWei(balanceDec, "mwei");
            setUsdtBalance(balance);
            setIsTransactionConfirm(true);
        } catch(e) {
            setModalShow(false);
        }
    };
    const withdraw = async(amount) => {
        try {
            setModalShow(true);
            setIsTransactionConfirm(false);
            //const withdraw_amount = await web3.utils.toWei(amount, 'ether');
           /* const withdraw_amount = Number(amount).toFixed(6).toString();
            const withdraw = await contract.methods.unstake(withdraw_amount).send({
                from : WalletState.account_address
            });
            const userInfo = await contract.methods.users(WalletState.account_address).call();
            const depositedAmount_t = web3.utils.fromWei(userInfo[0], "ether");
            setDepositedAmount( depositedAmount_t );*/
            setIsTransactionConfirm(true);
        } catch (e) {
            setModalShow(false);
        }
    };
    const onDashboard = () => {
        window.location.href="/dashboard";
    };
    return (
        <div className="home-container mb-5" style={{ fontFamily: 'Inter',color: 'white'}}>
            <Row style={{justifyContent:'center', marginTop:"30px"}}>
                <Col xl="4" md="12" sm="12" className="card-layout">
                    <p className="dashboard-title">IDO Allocation Submission</p>
                    <Alert className="custom-alert" variant="danger" >
                        Currently raised: ${(Math.round(Number(raisedAmount)*100)/100).toLocaleString('en')}/$100,000
                    </Alert>
                    <Card className="custom-card" style = {{ marginTop: "30px"}}>
                        <Row className='card-content-header'>
                            <Col>
                                <p>
                                   Submit an amount between $500~$1,000 USDT for your allocation. 
                                </p>
                            </Col>
                        </Row>
                        {depositedAmount < 500 ? (<p style = {{color:"red"}}>You need stake at least 500 RDX.<br /> Current Staked Amount : {Math.round(Number(depositedAmount)*100)/100} RDX</p>) : (<div></div>)}
                        <Row className='card-content-body'>
                            <Col>
                                <p style={{float:'left'}}>
                                    Stake Amount
                                </p>
                                <p style={{textAlign:'right'}}>
                                    Balance : {
                                        connectionState ? 
                                            !isButtonClicked ?
                                            usdtbalance > 0 ? Math.round(Number(usdtbalance)*100)/100 : "0"
                                            :depositedAmount > 0 ? Math.round(Number(depositedAmount)*100)/100 : "0"
                                         : "0"
                                    }
                                </p>
                            </Col>
                        </Row>
                        <Card className='balance-card'>
                            <Row>
                                <Col>
                                    <div style={{float:'left'}}>
                                        <img src={USDT} style={{float:'left'}}></img>
                                        <input value={isStakeAmount} type="text" placeholder="0.00" style={{width:"100px", border:'0px', marginLeft:'15px', fontSize:'20px', borderColor:"transparent"}} onChange={onhandleStakeAmount}></input>
                                    </div>
                                    <Button className="balance-card-buttion" onClick={onMaxBalance}>MAX</Button>    
                                </Col>
                            </Row>
                            <Row>
                                <Col>
                                    <div style={{float:'left'}}>
                                        <p style={{fontSize:"14px", marginTop:"10px"}}>USDT</p>
                                    </div>
                                    <span style={{fontSize:"14px", float:'right', marginTop:'10px', color:'black'}}>${isStakeAmountDollar}</span>
                                </Col>
                            </Row>
                        </Card>
                        {
                            !connectionState? (
                                <Button className="card-content-button" onClick={() => onConnetWallet()}>Connect Wallet</Button>        
                            ) : isApporveButton ? ( <Button className="card-content-button" onClick={() => onApprove()}>Approve</Button>) : (
                                    <Button disabled={isDisableDepositButton} className="card-content-button" onClick={() => !isButtonClicked ? onStaking() : onWithdraw()}>
                                        {
                                            !isButtonClicked ? "Submit Amount" : "Withdraw"
                                        }
                                    </Button>        
                                )
                        }
                        <p className="card-content-footer">
                            Submit a minium of $500 and a maximum of $1,000 USDT.<br/> You will be airdropped the equivalent of the project token once the raise is completed.
                        </p>
                    </Card>
                </Col>
            </Row>
            <Modal className="modal-form" show={isModalShow} onHide={closeModal} aria-labelledby="contained-modal-title-vcenter" centered>
                <Modal.Body>
                    {
                        !isTransactionConfirm ? (<img className="loadingbar" src={transactionLoader}></img>) : 
                        (<img className="confirmImage" src={confirmImage}></img>)
                    }
                    {
                        !isTransactionConfirm ? (<p className="modal-title">Waiting for Confirmation</p>) : 
                        (<p className="confirm-title">Transaction Submitted</p>)
                    }
                    {
                        !isTransactionConfirm ? (<p className="modal-content">Confirm this transaction in your wallet.</p>) : 
                        (<p className="confirm-content">View on etherscan</p>)
                    }
                </Modal.Body>
                <Modal.Footer className = "modal-footer">
                    {
                        !isTransactionConfirm ? "" : (<Button className="close-button" onClick={closeModal}>Close</Button>)
                    }
                    {
                        !isTransactionConfirm ? "" : (<Button className="dashboard-button" onClick={onDashboard}>My Dashboard</Button>)
                    }
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default Spume_IDOs;