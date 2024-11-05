import React from 'react';
import Web3 from 'web3';
import { Row, Col, Button, ButtonGroup, Card, Modal} from 'react-bootstrap';
import Form from 'react-bootstrap/Form';
import { useState, useEffect } from 'react';
import './index.scss';
import cardLogo from '../assets/img/card-logo.png';
import transactionLoader from '../assets/img/loader.gif';
import { useDispatch, useSelector } from "react-redux";
import * as selectors from "store/selectors";
import { updateWalletConnection } from "store/actions";
import { tokenAddresses } from 'config';
import { AbiItem } from 'web3-utils';
import tokenABI from '../abi/token.abi.json';
import stakingABI from '../abi/staking.abi.json';
import { StakingAddress } from 'config';
import confirmImage from '../assets/img/Shape.png';


declare let window: any;

const Staking = () => {
    const [isButtonClicked, setIsButtonClicked] = useState<boolean>(false);
    const [isModalShow, setModalShow] = useState<boolean>(false);
    const [isTransactionConfirm, setIsTransactionConfirm] = useState<boolean>(false);
    const [isStakeAmount, setIsStakeAmount] = useState<number>(0);
    const [isStakeAmountDollar, setIsStakeAmountDollar] = useState<number>(0);
    const [isDisableDepositButton, setIsDisableDepositButton] = useState<boolean>(false);
    const [isApporveButton, setIsApproveButton] = useState<boolean>(false);
    const [depositedAmount, setDepositedAmount] = useState<any>('0');

    const dispatch = useDispatch();
    const WalletState = useSelector(selectors.WalleteState);
    const connectionState = WalletState.wallet_connection;
    const wallet_balance = WalletState.wallet_balance;
    const web3 = new Web3(window.ethereum);

    const contract = new web3.eth.Contract(stakingABI as AbiItem[], StakingAddress);

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
        const rdxAddress = tokenAddresses[0].address;
        const tokenInst = new web3.eth.Contract(tokenABI as AbiItem[], rdxAddress);
        const amount = await web3.utils.toWei("9999999999999", "ether");
        console.log("rdxAddress = ", rdxAddress);
        const approve = await tokenInst.methods.approve(StakingAddress, amount).send({
            from : WalletState.account_address
        });
        setIsApproveButton(false);
    };
    useEffect(() => {
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
            const rdxAddress = tokenAddresses[0].address;
            const tokenInst = new web3.eth.Contract(tokenABI as AbiItem[], rdxAddress);
            const balanceDec = await tokenInst.methods.balanceOf(accounts[0]).call();
            const balance = await web3.utils.fromWei(balanceDec, "ether");
            const userInfo = await contract.methods.users(accounts[0]).call();
            const depositedAmount_t = web3.utils.fromWei(userInfo[0], "ether");
            setDepositedAmount( depositedAmount_t );
            const allowance = await tokenInst.methods.allowance(accounts[0], StakingAddress).call();
            if(allowance == 0) {
                console.log("allowance = ", allowance);
                setIsApproveButton(true);
            }
          dispatch(
            updateWalletConnection({
              connection_state: true,
              account_address: accounts[0].toString(),
              wallet_balance : balance,
            })
          );
        }
    }

    const loadWeb3 = async () => {
        try {
          if (window.ethereum?.isMetaMask) {
            const accounts = await window.ethereum.request({
              method: "eth_requestAccounts",
            });
            const account = Web3.utils.toChecksumAddress(accounts[0]).toString();
            const rdxAddress = tokenAddresses[0].address;
            const tokenInst = new web3.eth.Contract(tokenABI as AbiItem[], rdxAddress);
            const balanceDec = await tokenInst.methods.balanceOf(accounts[0]).call();
            const balance = await web3.utils.fromWei(balanceDec, "ether");
            const userInfo = await contract.methods.users(accounts[0]).call();
            const depositedAmount_t = web3.utils.fromWei(userInfo[0], "ether");
            setDepositedAmount( depositedAmount_t );
            const allowance = await tokenInst.methods.allowance(accounts[0], StakingAddress).call();
            if(allowance == 0) {
                console.log("allowance = ", allowance);
                setIsApproveButton(true);
            }

            dispatch(
              updateWalletConnection({
                connection_state: true,
                account_address: account,
                wallet_balance : balance,
              })
            );
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
            setIsStakeAmount(wallet_balance);
            setIsStakeAmountDollar (wallet_balance / 10);
        } else{
            setIsStakeAmount(depositedAmount);
            setIsStakeAmountDollar (depositedAmount / 10);
        }
        
        setIsDisableDepositButton(false);
    };
    const onhandleStakeAmount = (e) => {
        setIsStakeAmount(e.target.value);
        setIsStakeAmountDollar(e.target.value / 10);
        setIsDisableDepositButton(false);
        if(e.target.value == 0) setIsDisableDepositButton(true);
    };
    const deposit = async(amount) => {
        try {
            setModalShow(true);
            setIsTransactionConfirm(false);
            const deposit_amount = await web3.utils.toWei(amount, 'ether');
            const deposit = await contract.methods.stake(deposit_amount).send({
                from : WalletState.account_address
            });

            const rdxAddress = tokenAddresses[0].address;
            const tokenInst = new web3.eth.Contract(tokenABI as AbiItem[], rdxAddress);
            const balanceDec = await tokenInst.methods.balanceOf(WalletState.account_address).call();
            const balance = await web3.utils.fromWei(balanceDec, "ether");
            dispatch(
                updateWalletConnection({
                  connection_state: true,
                  account_address: WalletState.account_address.toString(),
                  wallet_balance : balance,
                })
              );
            setIsTransactionConfirm(true);
        } catch(e) {
            setModalShow(false);
        }
    };
    const withdraw = async(amount) => {
        try {
            setModalShow(true);
            setIsTransactionConfirm(false);
            const withdraw_amount = await web3.utils.toWei(amount, 'ether');
            const withdraw = await contract.methods.unstake(withdraw_amount).send({
                from : WalletState.account_address
            });
            const userInfo = await contract.methods.users(WalletState.account_address).call();
            const depositedAmount_t = web3.utils.fromWei(userInfo[0], "ether");
            setDepositedAmount( depositedAmount_t );
            setIsTransactionConfirm(true);
        } catch (e) {
            setModalShow(false);
        }
    };
    const onDashboard = () => {
        window.location.href="/dashboard";
    };
    return (
        <div className="home-container mb-5" style={{ color: 'white'}}>
            <Row style={{justifyContent:'center'}}>
                <Col xl="4" md="12" sm="12" className="card-layout">
                    <ButtonGroup>
                        <Button className='main-button' onClick={()=>{onClick('Deposit');}} style={{backgroundColor : isButtonClicked ? 'transparent' : '#9400FF'}}>Deposit & Lock</Button>
                        <Button className='main-button' onClick={()=>{onClick('withdraw');}} style={{backgroundColor : isButtonClicked ? '#9400FF' : 'transparent'}}>Withdraw</Button>
                    </ButtonGroup>
                    <Card className="custom-card">
                        <Row className='card-content-header'>
                            <Col>
                                <p>
                                    Stake RDX to participate in whitelists for our upcoming IDOs. 
                                    <a target = "_blank" rel = "noreferrer" href = "https://reduxprotocol.medium.com/its-been-a-busy-and-eventful-couple-of-months-here-at-redux-as-we-get-ready-to-relaunch-or-token-f014b566ef5b?source=friends_link&sk=c3410b9d19d919f9a58eb4779aea69b3"style={{color:'#6600AE'}}>&nbsp;Learn more</a>
                                </p>
                            </Col>
                        </Row>
                        <Row className='card-content-body'>
                            <Col>
                                <p style={{float:'left'}}>
                                    Stake Amount
                                </p>
                                <p style={{textAlign:'right'}}>
                                    Balance : {
                                        connectionState ? 
                                            !isButtonClicked ?
                                            wallet_balance > 0 ? Math.round(Number(wallet_balance)*100)/100 : "0"
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
                                        <img src={cardLogo} style={{float:'left'}}></img>
                                        <input value={isStakeAmount} type="text" placeholder="0.00" style={{width:"100px", border:'0px', marginLeft:'15px', fontSize:'20px', borderColor:"transparent"}} onChange={onhandleStakeAmount}></input>
                                    </div>
                                    <Button className="balance-card-buttion" onClick={onMaxBalance}>MAX</Button>    
                                </Col>
                            </Row>
                            <Row>
                                <Col>
                                    <div style={{float:'left'}}>
                                        <p style={{fontSize:"14px", marginTop:"10px"}}>RDX</p>
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
                                            !isButtonClicked ? "Deposit & Lock" : "Withdraw"
                                        }
                                    </Button>        
                                )
                        }
                        <p className="card-content-footer">
                        Your RDX tokens will be locked for 45 days. After this period, you’re free to withdraw at any time. It is important to note, that when you add more $RDX tokens to your stake, the 45 day lockup starts again on all tokens.
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

export default Staking;