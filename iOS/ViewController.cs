using System;
using Foundation;
using UIKit;
using CoreGraphics;
using AVFoundation;
using WikitudeComponent.iOS;
using Adeon.iOS.CoreServices;



namespace Adeon.iOS
{
    public partial class ViewController : UIViewController
    {
        protected WTArchitectView architectView;

        [Weak]
        protected WTNavigation loadedArExperienceNavigation;
        protected WTNavigation loadingArExperienceNavigation;

        protected NSObject applicationWillResignActiveObserver;
        protected NSObject applicationDidBecomeActiveObserver;

        private WTAuthorizationRequestManager authorizationRequestManager = new WTAuthorizationRequestManager();

        protected bool isRunning;

        public override void ViewDidLoad()
        {
            base.ViewDidLoad();

            architectView = new WTArchitectView();
            architectView.SetLicenseKey("d4+aKxOGTRBB+f+buOI1eDVk9NY3wZaTCDiEsN2ZV9UilBwsDbXrWiY1bt8jBcFIWyDNHbZ037vHSeEc8zJ5YrB3AtEhc/FvaJOK6vJqkU6IPNKZK/zMac7bVmZjrP2v8ReUUokkd7hfj6//ReBXVNiQ3ePQ1Heg/XGPYUr7xMhTYWx0ZWRfX20XMtB7PZbGeCdS+PRqMDypqb7e2kiph6mSJTR8z9iPrBfK1fpdATxwtMDpN3Zxsy31d7Rs/KEDO4pj+36zd4sT4bANOiomixmfSxoFLXLdK9okHqx06Gpq5C+m0eE7tsECiIgAX9wLXrpuhX9/FhyNsGm2LmlQHIw0KLU3NUQBgEVwokwnkFT1Cp3Z/p4fa49J+0E/Fr8CitR0PTQtWiPHUF+wLAYGbnYo7qWWODjKRGTXDL4IDsSk5TCBtsZX459qz9VW2rUkLtBbNEqqDMqvFARfrumuX9Wmb+DZnofDQ/7BHdHn8O2tkSDdG3ZZwiAfj6EY2cnNkUOQX4lCnMa9IN8y8yJB3fCbx6oHTlOcXtgVzbqg6/xXc0Gf8QNYgp6k0id+Vgo2aySyqcP7InnC4KrcM6BiHRhsrfVGsyaGTVc16ltlzfkSaY7kSUPGQqxyY7Ghdiw4R7dDN0RufiEvmB6YHW4a/wnByt8ORFQnpLJn8HsZ7Qa1S3XSOEaHPLwFZKpUKwRE+YBffAilgO5CeznCTE0droljwo82pmxHSCsxygSN7gw7gEWIetv0Z/nHceDxO9Zl");
            architectView.RequiredFeatures = WTFeatures.Geo;
            architectView.TranslatesAutoresizingMaskIntoConstraints = false;
            Add(architectView);

            architectView.CenterXAnchor.ConstraintEqualTo(View.CenterXAnchor).Active = true;
            architectView.CenterYAnchor.ConstraintEqualTo(View.CenterYAnchor).Active = true;
            architectView.WidthAnchor.ConstraintEqualTo(View.WidthAnchor).Active = true;
            architectView.HeightAnchor.ConstraintEqualTo(View.HeightAnchor).Active = true;

            EdgesForExtendedLayout = UIRectEdge.None;
        }

        public override void ViewWillAppear(bool animated)
        {
            base.ViewWillAppear(animated);

            /*  Controllo sul primo avvio dell'app sul dispositivo per mostrare
                il tutorial o meno
             */
            string firstTime = "" + NSUserDefaults.StandardUserDefaults.BoolForKey("FirstTime");
            string fn = "";
            if (firstTime == "False"){
                fn = "World.setFirstTime(true);";
            }
            else
            {
                fn = "World.setFirstTime(false);";
            }

            LoadArExperience();
            StartArchitectViewRendering();
            //architectView.CallJavaScript(fn);
            architectView.CallJavaScript("World.setFirstTime(true);"); //sostituzione momentanea

            if (firstTime == "False")
            {
                NSUserDefaults.StandardUserDefaults.SetBool(true, "FirstTime");
            }

            applicationWillResignActiveObserver = NSNotificationCenter.DefaultCenter.AddObserver(UIApplication.WillResignActiveNotification, ApplicationWillResignActive);
            applicationDidBecomeActiveObserver = NSNotificationCenter.DefaultCenter.AddObserver(UIApplication.DidBecomeActiveNotification, ApplicationDidBecomeActive);
        }


        public override void ViewDidDisappear(bool animated)
        {
            base.ViewDidDisappear(animated);


            //rilascia la variabile per i test, così è sempre come se fosse il primo avvio
            /*if ("" + NSUserDefaults.StandardUserDefaults.BoolForKey("FirstTime") == "False")
            {
                NSUserDefaults.StandardUserDefaults.SetBool(true, "FirstTime");
            }*/

            StopArchitectViewRendering();



            NSNotificationCenter.DefaultCenter.RemoveObserver(applicationWillResignActiveObserver);
            NSNotificationCenter.DefaultCenter.RemoveObserver(applicationDidBecomeActiveObserver);
        }

        public override void DidReceiveMemoryWarning()
        {
            base.DidReceiveMemoryWarning();
            // Release any cached data, images, etc that aren't in use.
        }

        public void ArchitectWorldFinishedLoading(WTNavigation navigation)
        {
            if (loadingArExperienceNavigation.Equals(navigation))
            {
                loadedArExperienceNavigation = navigation;
            }
        }

        #region Notifications
        private void ApplicationWillResignActive(NSNotification notification)
        {
            StopArchitectViewRendering();
        }

        private void ApplicationDidBecomeActive(NSNotification notification)
        {
            StartArchitectViewRendering();
        }
        #endregion

        #region Private Methods
        private void LoadArExperience()
        {
            ArExperienceAuthorizationController.AuthorizeRestricedAPIAccess(authorizationRequestManager, WTFeatures.Geo, () => {
                NSUrl fullArExperienceURL = NSBundle.MainBundle.GetUrlForResource("index", "html", "Milan");
                loadingArExperienceNavigation = architectView.LoadArchitectWorldFromURL(fullArExperienceURL);
            }, (UIAlertController alertController) => {
                PresentViewController(alertController, true, null);
            });
        }

        private void StartArchitectViewRendering()
        {
            if (!architectView.IsRunning)
            {
                architectView.Start((WTArchitectStartupConfiguration architectStartupConfiguration) =>
                {
                    architectStartupConfiguration.CaptureDevicePosition = AVCaptureDevicePosition.Back;
                    architectStartupConfiguration.CaptureDeviceResolution = WTCaptureDeviceResolution.WTCaptureDeviceResolution_AUTO;
                    architectStartupConfiguration.CaptureDeviceFocusMode = AVCaptureFocusMode.ContinuousAutoFocus;
                }, (bool success, NSError error) =>
                {
                    isRunning = success;
                });
            }
        }

        private void StopArchitectViewRendering()
        {
            if (isRunning)
            {
                NSUserDefaults.StandardUserDefaults.RemoveObject("FirstTime");
                architectView.Stop();
            }
        }
        #endregion

        public ViewController(IntPtr handle) : base(handle)
        {

        }
    }
}